import { AppBar, Toolbar, Typography, Button, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { DataGrid } from '@mui/x-data-grid';
import { ColorModeContext } from '../theme/ColorModeContext';
import { useTheme } from '@mui/material/styles';

export default function Navbar() {
  const location = useLocation();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [openSettings, setOpenSettings] = useState(false);
  const [config, setConfig] = useState({ directories_to_scan: [], subnets_to_scan: [] });
  const [dirRows, setDirRows] = useState([]);
  const [subnetRows, setSubnetRows] = useState([]);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    // Convert config arrays to row format with IDs
    setDirRows(config.directories_to_scan.map((dir, index) => ({
      id: index,
      path: dir,
    })));
    setSubnetRows(config.subnets_to_scan.map((subnet, index) => ({
      id: index,
      subnet: subnet,
    })));
  }, [config]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      console.log('Raw rows before processing:', {
        dirRows: dirRows.map(r => ({ id: r.id, path: r.path })),
        subnetRows: subnetRows.map(r => ({ id: r.id, subnet: r.subnet }))
      });
      
      // Filter out empty values and trim when saving
      const newConfig = {
        directories_to_scan: dirRows
          .map(row => {
            console.log(`Processing directory row:`, row);
            return row.path?.trim();
          })
          .filter(path => {
            const keep = path && path !== '';
            console.log(`Directory path "${path}" - keep? ${keep}`);
            return keep;
          }),
        subnets_to_scan: subnetRows
          .map(row => {
            console.log(`Processing subnet row:`, row);
            return row.subnet?.trim();
          })
          .filter(subnet => {
            const keep = subnet && subnet !== '';
            console.log(`Subnet "${subnet}" - keep? ${keep}`);
            return keep;
          })
      };

      console.log('Final config to be sent:', JSON.stringify(newConfig, null, 2));

      const response = await fetch('http://localhost:5000/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      const responseData = await response.json();
      console.log('Server response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      if (response.ok) {
        setConfig(newConfig);
        setOpenSettings(false);
      } else {
        console.error('Failed to update config:', responseData.error);
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handleProcessRowUpdate = (newRow, oldRow) => {
    console.log('Processing row update:', { newRow, oldRow });
    
    // Update the appropriate state based on which grid is being edited
    if ('path' in newRow) {
      setDirRows(prevRows => 
        prevRows.map(row => row.id === newRow.id ? newRow : row)
      );
    } else if ('subnet' in newRow) {
      setSubnetRows(prevRows => 
        prevRows.map(row => row.id === newRow.id ? newRow : row)
      );
    }
    
    return newRow;
  };

  const handleAddDirectory = () => {
    const newId = dirRows.length > 0 ? Math.max(...dirRows.map(r => r.id)) + 1 : 0;
    const newRow = { id: newId, path: '' };
    console.log('Adding new directory row:', newRow);
    setDirRows(prev => [...prev, newRow]);
  };

  const handleAddSubnet = () => {
    const newId = subnetRows.length > 0 ? Math.max(...subnetRows.map(r => r.id)) + 1 : 0;
    const newRow = { id: newId, subnet: '' };
    console.log('Adding new subnet row:', newRow);
    setSubnetRows(prev => [...prev, newRow]);
  };

  const dirColumns = [
    { 
      field: 'path', 
      headerName: 'Directory Path', 
      flex: 1,
      editable: true
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton
          onClick={() => {
            console.log('Deleting directory row:', params.row);
            setDirRows(prev => prev.filter(row => row.id !== params.row.id));
          }}
          color="error"
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
    }
  ];

  const subnetColumns = [
    { 
      field: 'subnet', 
      headerName: 'Subnet', 
      flex: 1,
      editable: true
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton
          onClick={() => {
            console.log('Deleting subnet row:', params.row);
            setSubnetRows(prev => prev.filter(row => row.id !== params.row.id));
          }}
          color="error"
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
    }
  ];

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
    position: 'relative',
    '&:hover': {
      opacity: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    ...(active && {
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -8,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: theme.palette.mode === 'dark' ? '#fff' : '#fff',
        borderRadius: '2px 2px 0 0',
      }
    })
  });

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: theme.palette.navbar.text,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9,
            }
          }}
          onClick={handleRefresh}
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
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          sx={{ ml: 1, color: theme.palette.navbar.text }}
          onClick={() => setOpenSettings(true)}
        >
          <SettingsIcon />
        </IconButton>
        <IconButton
          sx={{ ml: 1, color: theme.palette.navbar.text }}
          onClick={colorMode.toggleColorMode}
        >
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>

      <Dialog 
        open={openSettings} 
        onClose={() => setOpenSettings(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Configuration Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 300, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>Directories to Scan</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={handleAddDirectory}
              >
                Add Directory
              </Button>
            </Box>
            <DataGrid
              rows={dirRows}
              columns={dirColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              processRowUpdate={handleProcessRowUpdate}
              onProcessRowUpdateError={(error) => {
                console.error('Error processing row update:', error);
              }}
              experimentalFeatures={{ newEditingApi: true }}
              editMode="cell"
              sx={{ mb: 2 }}
            />
          </Box>

          <Box sx={{ height: 300 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>Subnets to Scan</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={handleAddSubnet}
              >
                Add Subnet
              </Button>
            </Box>
            <DataGrid
              rows={subnetRows}
              columns={subnetColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              processRowUpdate={handleProcessRowUpdate}
              onProcessRowUpdateError={(error) => {
                console.error('Error processing row update:', error);
              }}
              experimentalFeatures={{ newEditingApi: true }}
              editMode="cell"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            console.log('Canceling changes. Current state:', { dirRows, subnetRows });
            setOpenSettings(false);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              console.log('Saving changes. Current state:', { dirRows, subnetRows });
              handleSaveConfig();
            }} 
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
