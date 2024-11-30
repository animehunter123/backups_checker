import { useEffect, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import DataTable from '../components/DataTable';
import { getServers } from '../api';

const columns = [
  { field: 'hostname', headerName: 'Hostname' },
  { field: 'ip_address', headerName: 'IP Address' },
  { field: 'detected_os', headerName: 'OS' },
  { 
    field: 'backup_status', 
    headerName: 'Backup Status',
    valueFormatter: (value) => {
      switch (value) {
        case 'green': return 'Recent Backup';
        case 'yellow': return 'Old Backup';
        case 'red': return 'No Backup';
        default: return 'Unknown';
      }
    }
  },
  { 
    field: 'last_scan', 
    headerName: 'Last Scan',
    valueFormatter: (value) => new Date(value).toLocaleString()
  }
];

export default function BackupStatus() {
  const [servers, setServers] = useState([]);
  const [error, setError] = useState(null);

  const fetchServers = async () => {
    try {
      const response = await getServers();
      setServers(response.servers);
      setError(null);
    } catch (err) {
      setError('Failed to fetch server data');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleExportCsv = () => {
    const headers = columns.map(col => col.headerName).join(',');
    const rows = servers.map(server => 
      columns.map(col => {
        const value = server[col.field];
        return col.valueFormatter ? col.valueFormatter(value) : value;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_status.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Server Backup Status
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable 
        data={servers}
        columns={columns}
        onExportCsv={handleExportCsv}
      />
    </Box>
  );
}
