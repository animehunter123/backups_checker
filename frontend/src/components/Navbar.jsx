import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from '../theme/ColorModeContext';
import { useTheme } from '@mui/material/styles';

export default function Navbar() {
  const location = useLocation();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkStyle = {
    textDecoration: 'none',
    marginLeft: '8px',
    marginRight: '8px',
  };

  const buttonStyle = (active) => ({
    color: theme.palette.navbar.text,
    fontWeight: active ? 600 : 500,
    opacity: active ? 1 : 0.85,
    '&:hover': {
      opacity: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
            color: theme.palette.navbar.text,
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
              Files
            </Button>
          </Link>
          <Link to="/servers" style={linkStyle}>
            <Button sx={buttonStyle(isActive('/servers'))}>
              Servers
            </Button>
          </Link>
          <IconButton
            onClick={colorMode.toggleColorMode}
            color="inherit"
            sx={{
              ml: 2,
              color: theme.palette.navbar.text,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
