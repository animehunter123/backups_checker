import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkStyle = {
    textDecoration: 'none',
    marginLeft: '8px',
    marginRight: '8px',
  };

  const buttonStyle = (active) => ({
    color: active ? 'primary.main' : 'text.primary',
    fontWeight: active ? 600 : 500,
    '&:hover': {
      backgroundColor: 'rgba(37, 99, 235, 0.04)',
    },
  });

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          Backup Checker
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Link to="/" style={linkStyle}>
            <Button sx={buttonStyle(isActive('/'))}>
              Backup Status
            </Button>
          </Link>
          <Link to="/directories" style={linkStyle}>
            <Button sx={buttonStyle(isActive('/directories'))}>
              Directories
            </Button>
          </Link>
          <Link to="/servers" style={linkStyle}>
            <Button sx={buttonStyle(isActive('/servers'))}>
              Servers
            </Button>
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
