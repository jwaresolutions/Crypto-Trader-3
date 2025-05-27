import DatabaseService from './databaseService';

export interface UserPreferences {
  id: string;
  userId: string;
  theme: string;
  notifications: boolean;
  defaultCapital: number;
  riskTolerance: 'low' | 'medium' | 'high';
  tradingPairs: string[];
}

class UserPreferencesService {
  private static instance: UserPreferencesService;

  private constructor() {}

  public static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const user = await DatabaseService.getClient().user.findUnique({
        where: { id: userId },
        include: { preferences: true }
      });

      if (!user?.preferences) {
        return null;
      }

      return {
        id: user.preferences.id,
        userId: user.preferences.userId,
        theme: user.preferences.theme,
        notifications: user.preferences.notifications,
        defaultCapital: user.preferences.defaultCapital,
        riskTolerance: user.preferences.riskTolerance as 'low' | 'medium' | 'high',
        tradingPairs: JSON.parse(user.preferences.tradingPairs)
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<Omit<UserPreferences, 'id' | 'userId'>>): Promise<UserPreferences | null> {
    try {
      const updatedPreferences = await DatabaseService.getClient().userPreferences.upsert({
        where: { userId },
        update: {
          ...(preferences.theme && { theme: preferences.theme }),
          ...(preferences.notifications !== undefined && { notifications: preferences.notifications }),
          ...(preferences.defaultCapital !== undefined && { defaultCapital: preferences.defaultCapital }),
          ...(preferences.riskTolerance && { riskTolerance: preferences.riskTolerance }),
          ...(preferences.tradingPairs && { tradingPairs: JSON.stringify(preferences.tradingPairs) })
        },
        create: {
          userId,
          theme: preferences.theme || 'dark',
          notifications: preferences.notifications ?? true,
          defaultCapital: preferences.defaultCapital || 10000,
          riskTolerance: preferences.riskTolerance || 'medium',
          tradingPairs: JSON.stringify(preferences.tradingPairs || ['AAPL', 'TSLA', 'SPY'])
        }
      });

      return {
        id: updatedPreferences.id,
        userId: updatedPreferences.userId,
        theme: updatedPreferences.theme,
        notifications: updatedPreferences.notifications,
        defaultCapital: updatedPreferences.defaultCapital,
        riskTolerance: updatedPreferences.riskTolerance as 'low' | 'medium' | 'high',
        tradingPairs: JSON.parse(updatedPreferences.tradingPairs)
      };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return null;
    }
  }

  async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    try {
      const preferences = await DatabaseService.getClient().userPreferences.create({
        data: {
          userId,
          theme: 'dark',
          notifications: true,
          defaultCapital: 10000,
          riskTolerance: 'medium',
          tradingPairs: JSON.stringify(['AAPL', 'TSLA', 'SPY', 'QQQ', 'BTC-USD', 'ETH-USD'])
        }
      });

      return {
        id: preferences.id,
        userId: preferences.userId,
        theme: preferences.theme,
        notifications: preferences.notifications,
        defaultCapital: preferences.defaultCapital,
        riskTolerance: preferences.riskTolerance as 'low' | 'medium' | 'high',
        tradingPairs: JSON.parse(preferences.tradingPairs)
      };
    } catch (error) {
      console.error('Error creating default preferences:', error);
      throw error;
    }
  }

  async deleteUserPreferences(userId: string): Promise<boolean> {
    try {
      await DatabaseService.getClient().userPreferences.delete({
        where: { userId }
      });
      return true;
    } catch (error) {
      console.error('Error deleting user preferences:', error);
      return false;
    }
  }
}

export default UserPreferencesService.getInstance();
