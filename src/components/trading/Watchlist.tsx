import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Paper,
  Menu,
  MenuItem,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Visibility,
  Add,
  Delete,
  Search,
  TrendingUp,
  TrendingDown,
  MoreVert,
  Star,
  StarBorder
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setCurrentSymbol } from '../../store/slices/marketDataSlice';

interface WatchlistItem {
  symbol: string;
  name: string;
  isFavorite: boolean;
}

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: 'BTCUSD', name: 'Bitcoin', isFavorite: true },
  { symbol: 'ETHUSD', name: 'Ethereum', isFavorite: true },
  { symbol: 'ADAUSD', name: 'Cardano', isFavorite: false },
  { symbol: 'SOLUSD', name: 'Solana', isFavorite: false },
  { symbol: 'DOTUSD', name: 'Polkadot', isFavorite: false },
  { symbol: 'LINKUSD', name: 'Chainlink', isFavorite: false },
  { symbol: 'MATICUSD', name: 'Polygon', isFavorite: false },
  { symbol: 'AVAXUSD', name: 'Avalanche', isFavorite: false },
  { symbol: 'ATOMUSD', name: 'Cosmos', isFavorite: false },
  { symbol: 'ALGOUSD', name: 'Algorand', isFavorite: false }
];

const Watchlist: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { symbols, currentSymbol } = useSelector((state: RootState) => state.marketData);
  
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Filter watchlist based on search and favorites
  const filteredWatchlist = useMemo(() => {
    let filtered = watchlist;

    if (showOnlyFavorites) {
      filtered = filtered.filter(item => item.isFavorite);
    }

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [watchlist, searchTerm, showOnlyFavorites]);

  const handleSymbolClick = (symbol: string) => {
    dispatch(setCurrentSymbol(symbol));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, symbol: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedSymbol(symbol);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSymbol(null);
  };

  const handleToggleFavorite = () => {
    if (selectedSymbol) {
      setWatchlist(prev => prev.map(item => 
        item.symbol === selectedSymbol 
          ? { ...item, isFavorite: !item.isFavorite }
          : item
      ));
    }
    handleMenuClose();
  };

  const handleRemoveFromWatchlist = () => {
    if (selectedSymbol) {
      setWatchlist(prev => prev.filter(item => item.symbol !== selectedSymbol));
    }
    handleMenuClose();
  };

  const getPriceData = (symbol: string) => {
    const data = symbols[symbol];
    if (!data) return null;

    const changePercent = ((data.price - data.prevClose) / data.prevClose * 100);
    const isPositive = changePercent >= 0;

    return {
      price: data.price,
      change: data.price - data.prevClose,
      changePercent,
      isPositive
    };
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    return price.toFixed(4);
  };

  const formatChange = (change: number, percent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  };

  return (
    <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Visibility />
          Watchlist
        </Typography>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search symbols..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />

        {/* Filter Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Chip
            label="All"
            variant={!showOnlyFavorites ? "filled" : "outlined"}
            onClick={() => setShowOnlyFavorites(false)}
            size="small"
          />
          <Chip
            label="Favorites"
            variant={showOnlyFavorites ? "filled" : "outlined"}
            onClick={() => setShowOnlyFavorites(true)}
            size="small"
            icon={<Star />}
          />
        </Box>
      </Box>

      {/* Watchlist Items */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredWatchlist.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            {searchTerm ? 'No symbols match your search.' : 'No items in watchlist.'}
          </Alert>
        ) : (
          <List dense>
            {filteredWatchlist.map((item) => {
              const priceData = getPriceData(item.symbol);
              const isSelected = currentSymbol === item.symbol;

              return (
                <ListItem
                  key={item.symbol}
                  button
                  selected={isSelected}
                  onClick={() => handleSymbolClick(item.symbol)}
                  sx={{
                    borderLeft: isSelected ? 3 : 0,
                    borderColor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    },
                  }}
                >
                  {/* Symbol and Favorite Icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                    {item.isFavorite && (
                      <Star sx={{ color: 'warning.main', fontSize: 16, mr: 0.5 }} />
                    )}
                  </Box>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" noWrap>
                          {item.symbol.replace('USD', '')}
                        </Typography>
                        {priceData && (
                          <Typography 
                            variant="body2" 
                            sx={{ fontWeight: 'bold', minWidth: 60, textAlign: 'right' }}
                          >
                            ${formatPrice(priceData.price)}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {item.name}
                        </Typography>
                        {priceData && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {priceData.isPositive ? (
                              <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
                            ) : (
                              <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />
                            )}
                            <Typography 
                              variant="caption" 
                              color={priceData.isPositive ? 'success.main' : 'error.main'}
                              sx={{ fontWeight: 'bold', minWidth: 60, textAlign: 'right' }}
                            >
                              {formatChange(priceData.change, priceData.changePercent)}
                            </Typography>
                          </span>
                        )}
                      </span>
                    }
                  />

                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleMenuOpen(e, item.symbol)}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleToggleFavorite}>
          {selectedSymbol && watchlist.find(item => item.symbol === selectedSymbol)?.isFavorite ? (
            <>
              <StarBorder sx={{ mr: 1 }} />
              Remove from Favorites
            </>
          ) : (
            <>
              <Star sx={{ mr: 1 }} />
              Add to Favorites
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleRemoveFromWatchlist}>
          <Delete sx={{ mr: 1 }} />
          Remove from Watchlist
        </MenuItem>
      </Menu>

      {/* Add Symbol Button */}
      <Box sx={{ p: 2, pt: 1 }}>
        <Tooltip title="Add new symbol to watchlist">
          <Button
            fullWidth
            variant="outlined"
            sx={{
              border: 1,
              borderColor: 'divider',
              borderStyle: 'dashed',
              borderRadius: 1,
              py: 1,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <Add />
          </Button>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default Watchlist;
