import { Button, CircularProgress } from '@mui/material';
import { useState } from 'react';

export default function ScanButton({ onClick, label }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleClick}
      disabled={isLoading}
      sx={{ position: 'relative' }}
    >
      {label}
      {isLoading && (
        <CircularProgress
          size={24}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-12px',
            marginLeft: '-12px',
          }}
        />
      )}
    </Button>
  );
}
