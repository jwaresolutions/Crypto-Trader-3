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
  ListItemText
} from '@mui/material';
import {
  TrendingUp,
  AccountCircle,
  Logout,
  Settings,
  DarkMode,
  LightMode,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';

interface NavigationBarProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onMenuClick?: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ 
  darkMode = false, 
  onToggleDarkMode, 
  onMenuClick 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, accountId } = useSelector((state: RootState) => state.auth);
  const { account } = useSelector((state: RootState) => state.portfolio);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <TrendingUp sx={{ fontSize: 28, color: 'primary.main', mr: 1 }} />
          <Typography variant="h6" component="div" fontWeight="bold" color="text.primary">
            CryptoTrader
          </Typography>
          
          {/* Account Status */}
          {account && (
            <Box sx={{ ml: 3 }}>
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
          {onToggleDarkMode && (
            <MenuItem onClick={onToggleDarkMode}>
              <ListItemIcon>
                {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
              </ListItemIcon>
              <ListItemText>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </ListItemText>
            </MenuItem>
          )}

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
    </AppBar>
  );
};

export default NavigationBar;
