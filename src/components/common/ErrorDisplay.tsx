import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  title?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  title = 'Error' 
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="error">
        <AlertTitle>{title}</AlertTitle>
        {error}
        {onRetry && (
          <Box sx={{ mt: 2 }}>
            <Button
              startIcon={<Refresh />}
              onClick={onRetry}
              variant="outlined"
              size="small"
            >
              Retry
            </Button>
          </Box>
        )}
      </Alert>
    </Box>
  );
};

export default ErrorDisplay;
