import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Settings,
  DarkMode,
  LightMode,
  Menu as MenuIcon,
  Notifications
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { toggleDarkMode } from '../../store/slices/themeSlice';
import NotificationCenter from '../common/NotificationCenter';

interface NavigationBarProps {
  onMenuClick?: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ 
  onMenuClick 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, accountId } = useSelector((state: RootState) => state.auth);
  const { account } = useSelector((state: RootState) => state.portfolio);
  const darkMode = useSelector((state: RootState) => state.theme.darkMode);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
  };

  const handleDarkModeToggle = () => {
    dispatch(toggleDarkMode());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'RESTRICTED':
        return 'warning';
      case 'CLOSED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        width: { sm: `calc(100% - 240px)` },
        ml: { sm: '240px' },
      }}
    >
      <Toolbar>
        {/* Mobile menu button */}
        {onMenuClick && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Account Status and Portfolio Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {/* Account Status */}
          {account && (
            <Box>
              <Chip
                label={`Paper Trading - ${account.status}`}
                color={getStatusColor(account.status) as any}
                size="small"
                variant="outlined"
              />
            </Box>
          )}
        </Box>

        {/* Portfolio Value */}
        {account && (
          <Box sx={{ mr: 2, textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Portfolio Value
            </Typography>
            <Typography variant="h6" color="text.primary" fontWeight="bold">
              ${account.portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        )}

        {/* Notifications */}
        <IconButton
          size="large"
          onClick={() => setNotificationCenterOpen(true)}
          color="inherit"
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <Notifications />
          </Badge>
        </IconButton>

        {/* Account Menu */}
        <IconButton
          size="large"
          onClick={handleMenuOpen}
          color="inherit"
          sx={{ ml: 1 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            <AccountCircle />
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 8,
            sx: {
              minWidth: 280,
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 24,
                height: 24,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Account: {accountId}
            </Typography>
            {user?.email && (
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            )}
            {account && (
              <Typography variant="body2" color="text.secondary">
                Cash: ${account.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Menu Items */}
          <MenuItem onClick={handleDarkModeToggle}>
            <ListItemIcon>
              {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </ListItemIcon>
            <ListItemText>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </ListItemText>
          </MenuItem>

          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
      />
    </AppBar>
  );
};

export default NavigationBar;
