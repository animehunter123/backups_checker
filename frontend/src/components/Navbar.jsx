import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    marginLeft: 2,
    marginRight: 2,
  };

  const activeStyle = {
    ...linkStyle,
    borderBottom: '2px solid white',
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Backup Checker
        </Typography>
        <Box>
          <Link to="/" style={isActive('/') ? activeStyle : linkStyle}>
            <Button color="inherit">Backup Status</Button>
          </Link>
          <Link to="/directories" style={isActive('/directories') ? activeStyle : linkStyle}>
            <Button color="inherit">Directories</Button>
          </Link>
          <Link to="/servers" style={isActive('/servers') ? activeStyle : linkStyle}>
            <Button color="inherit">Servers</Button>
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
