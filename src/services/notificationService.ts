import DatabaseService from './databaseService';

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

class NotificationService {
  private static instance: NotificationService;
  private eventListeners: Map<string, (notification: NotificationData) => void> = new Map();

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Create a new notification
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority?: 'low' | 'medium' | 'high';
    actionUrl?: string;
  }): Promise<NotificationData> {
    try {
      // For now, we'll store notifications in audit logs until we add a notifications table
      const auditLog = await DatabaseService.logAudit({
        userId: data.userId,
        action: 'notification_created',
        details: {
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'medium',
          actionUrl: data.actionUrl,
          isRead: false
        }
      });

      const notification: NotificationData = {
        id: auditLog.id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'medium',
        isRead: false,
        actionUrl: data.actionUrl,
        createdAt: auditLog.timestamp,
      };

      // Notify listeners
      this.notifyListeners(data.userId, notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getNotifications(
    userId: string,
    options: {
      limit?: number;
      unreadOnly?: boolean;
      type?: string;
      priority?: string;
    } = {}
  ): Promise<NotificationData[]> {
    try {
      const auditLogs = await DatabaseService.getClient().auditLog.findMany({
        where: {
          userId,
          action: 'notification_created',
          ...(options.unreadOnly && {
            details: {
              contains: '"isRead":false'
            }
          })
        },
        orderBy: { timestamp: 'desc' },
        take: options.limit || 50
      });

      return auditLogs.map(log => {
        const details = JSON.parse(log.details || '{}');
        return {
          id: log.id,
          userId: log.userId!,
          title: details.title || 'Notification',
          message: details.message || '',
          type: details.type || 'info',
          priority: details.priority || 'medium',
          isRead: details.isRead || false,
          actionUrl: details.actionUrl,
          createdAt: log.timestamp,
          readAt: details.readAt ? new Date(details.readAt) : undefined
        };
      }).filter(notification => {
        if (options.type && notification.type !== options.type) return false;
        if (options.priority && notification.priority !== options.priority) return false;
        return true;
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const auditLog = await DatabaseService.getClient().auditLog.findUnique({
        where: { id: notificationId }
      });

      if (!auditLog) return false;

      const details = JSON.parse(auditLog.details || '{}');
      details.isRead = true;
      details.readAt = new Date().toISOString();

      await DatabaseService.getClient().auditLog.update({
        where: { id: notificationId },
        data: {
          details: JSON.stringify(details)
        }
      });

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const notifications = await this.getNotifications(userId, { unreadOnly: true });
      
      for (const notification of notifications) {
        await this.markAsRead(notification.id);
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadNotifications = await this.getNotifications(userId, { unreadOnly: true });
      return unreadNotifications.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await DatabaseService.getClient().auditLog.delete({
        where: { id: notificationId }
      });
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Clear old notifications (older than specified days)
  async clearOldNotifications(userId: string, daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await DatabaseService.getClient().auditLog.deleteMany({
        where: {
          userId,
          action: 'notification_created',
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error clearing old notifications:', error);
      return 0;
    }
  }

  // Add event listener for real-time notifications
  addListener(userId: string, callback: (notification: NotificationData) => void): void {
    this.eventListeners.set(userId, callback);
  }

  // Remove event listener
  removeListener(userId: string): void {
    this.eventListeners.delete(userId);
  }

  // Notify listeners of new notifications
  private notifyListeners(userId: string, notification: NotificationData): void {
    const listener = this.eventListeners.get(userId);
    if (listener) {
      listener(notification);
    }
  }

  // Predefined notification types for common events
  async notifyTradeExecuted(userId: string, symbol: string, side: string, quantity: number, price: number): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Trade Executed',
      message: `${side.toUpperCase()} ${quantity} shares of ${symbol} at $${price.toFixed(2)}`,
      type: 'success',
      priority: 'medium'
    });
  }

  async notifyTradeFailed(userId: string, symbol: string, side: string, reason: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Trade Failed',
      message: `${side.toUpperCase()} order for ${symbol} failed: ${reason}`,
      type: 'error',
      priority: 'high'
    });
  }

  async notifyStrategyAlert(userId: string, strategyName: string, message: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Strategy Alert',
      message: `${strategyName}: ${message}`,
      type: 'warning',
      priority: 'medium'
    });
  }

  async notifyRiskAlert(userId: string, message: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'Risk Management Alert',
      message,
      type: 'error',
      priority: 'high'
    });
  }

  async notifySystemEvent(userId: string, event: string, details: string): Promise<void> {
    await this.createNotification({
      userId,
      title: 'System Event',
      message: `${event}: ${details}`,
      type: 'info',
      priority: 'low'
    });
  }
}

export default NotificationService.getInstance();
