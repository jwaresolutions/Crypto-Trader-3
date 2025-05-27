import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { 
  createStrategy, 
  updateStrategy, 
  deleteStrategy,
  StrategyTemplate,
  StrategyParameter,
  TradeStrategy 
} from '../store/slices/strategiesSlice';

const StrategyConfiguration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { strategies, templates, isLoading, error } = useSelector((state: RootState) => state.strategies);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<TradeStrategy | null>(null);
  const [strategyName, setStrategyName] = useState('');
  const [strategyParameters, setStrategyParameters] = useState<StrategyParameter[]>([]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <AssessmentIcon />;
      case 'fundamental': return <TrendingUpIcon />;
      case 'sentiment': return <PsychologyIcon />;
      case 'momentum': return <SpeedIcon />;
      case 'custom': return <BuildIcon />;
      default: return <AssessmentIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'primary';
      case 'fundamental': return 'success';
      case 'sentiment': return 'warning';
      case 'momentum': return 'error';
      case 'custom': return 'secondary';
      default: return 'default';
    }
  };

  const handleCreateStrategy = () => {
    if (!selectedTemplate || !strategyName.trim()) return;

    dispatch(createStrategy({
      templateId: selectedTemplate.id,
      name: strategyName,
      parameters: strategyParameters,
    }));

    setCreateDialogOpen(false);
    setSelectedTemplate(null);
    setStrategyName('');
    setStrategyParameters([]);
  };

  const handleEditStrategy = () => {
    if (!selectedStrategy) return;

    dispatch(updateStrategy({
      id: selectedStrategy.id,
      parameters: strategyParameters,
    }));

    setEditDialogOpen(false);
    setSelectedStrategy(null);
    setStrategyParameters([]);
  };

  const handleDeleteStrategy = (strategyId: string) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      dispatch(deleteStrategy(strategyId));
    }
  };

  const openCreateDialog = (template: StrategyTemplate) => {
    setSelectedTemplate(template);
    setStrategyParameters([...template.defaultParameters]);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (strategy: TradeStrategy) => {
    setSelectedStrategy(strategy);
    setStrategyParameters([...strategy.parameters]);
    setEditDialogOpen(true);
  };

  const renderParameterInput = (parameter: StrategyParameter, index: number) => {
    const updateParameter = (value: any) => {
      const newParameters = [...strategyParameters];
      newParameters[index] = { ...parameter, value };
      setStrategyParameters(newParameters);
    };

    switch (parameter.type) {
      case 'number':
        return (
          <Box key={parameter.name} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {parameter.description}
            </Typography>
            <TextField
              fullWidth
              label={parameter.name}
              type="number"
              value={parameter.value}
              onChange={(e) => updateParameter(Number(e.target.value))}
              inputProps={{
                min: parameter.min,
                max: parameter.max,
                step: parameter.step,
              }}
            />
            {parameter.min !== undefined && parameter.max !== undefined && (
              <Slider
                value={parameter.value}
                min={parameter.min}
                max={parameter.max}
                step={parameter.step || 1}
                onChange={(_, value) => updateParameter(value)}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        );

      case 'boolean':
        return (
          <Box key={parameter.name} sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={parameter.value}
                  onChange={(e) => updateParameter(e.target.checked)}
                />
              }
              label={parameter.name}
            />
            <Typography variant="body2" color="text.secondary">
              {parameter.description}
            </Typography>
          </Box>
        );

      case 'select':
        return (
          <Box key={parameter.name} sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>{parameter.name}</InputLabel>
              <Select
                value={parameter.value}
                label={parameter.name}
                onChange={(e) => updateParameter(e.target.value)}
              >
                {parameter.options?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {parameter.description}
            </Typography>
          </Box>
        );

      case 'string':
        return (
          <Box key={parameter.name} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label={parameter.name}
              value={parameter.value}
              onChange={(e) => updateParameter(e.target.value)}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {parameter.description}
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Strategy Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Create and configure trading strategies from templates. Each strategy will emit buy, short, or none signals.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Strategy Templates */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Strategy Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose from pre-built strategy templates to create your custom strategies.
            </Typography>

            <Grid container spacing={2}>
              {templates.map((template) => (
                <Grid item xs={12} key={template.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getCategoryIcon(template.category)}
                        <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                          {template.name}
                        </Typography>
                        <Chip
                          label={template.category}
                          color={getCategoryColor(template.category) as any}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => openCreateDialog(template)}
                        disabled={isLoading}
                      >
                        Create Strategy
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Configured Strategies */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configured Strategies ({strategies.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your configured trading strategies and their parameters.
            </Typography>

            {strategies.length === 0 ? (
              <Alert severity="info">
                No strategies configured yet. Create your first strategy from the templates on the left.
              </Alert>
            ) : (
              <List>
                {strategies.map((strategy, index) => (
                  <React.Fragment key={strategy.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getCategoryIcon(strategy.category)}
                            <Typography variant="subtitle1">{strategy.name}</Typography>
                            <Chip
                              label={strategy.currentSignal}
                              color={
                                strategy.currentSignal === 'buy' ? 'success' :
                                strategy.currentSignal === 'short' ? 'error' : 'default'
                              }
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {strategy.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Performance: {strategy.performance.totalSignals} signals, {strategy.performance.winRate.toFixed(1)}% win rate
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Edit Strategy">
                          <IconButton onClick={() => openEditDialog(strategy)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Strategy">
                          <IconButton 
                            onClick={() => handleDeleteStrategy(strategy.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < strategies.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Create Strategy Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create New Strategy
          {selectedTemplate && (
            <Typography variant="body2" color="text.secondary">
              Based on: {selectedTemplate.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Strategy Name"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            sx={{ mb: 3, mt: 1 }}
          />
          
          {strategyParameters.map((parameter, index) => renderParameterInput(parameter, index))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateStrategy}
            variant="contained"
            disabled={!strategyName.trim() || isLoading}
          >
            Create Strategy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Strategy Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Strategy
          {selectedStrategy && (
            <Typography variant="body2" color="text.secondary">
              {selectedStrategy.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {strategyParameters.map((parameter, index) => renderParameterInput(parameter, index))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditStrategy}
            variant="contained"
            disabled={isLoading}
          >
            Update Strategy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StrategyConfiguration;
