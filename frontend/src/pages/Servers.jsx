import { useEffect, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import DataTable from '../components/DataTable';
import ScanButton from '../components/ScanButton';
import { getServers, scanServers } from '../api';

const columns = [
  { field: 'hostname', headerName: 'Hostname' },
  { field: 'ip_address', headerName: 'IP Address' },
  { field: 'detected_os', headerName: 'OS' },
  { field: 'open_ports', headerName: 'Open Ports' },
  { 
    field: 'is_reachable', 
    headerName: 'Status',
    valueFormatter: (value) => value ? 'Online' : 'Offline'
  },
  { 
    field: 'last_scan', 
    headerName: 'Last Scan',
    valueFormatter: (value) => new Date(value).toLocaleString()
  }
];

export default function Servers() {
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

  const handleScan = async () => {
    try {
      await scanServers();
      await fetchServers();
      setError(null);
    } catch (err) {
      setError('Failed to scan servers');
      console.error(err);
    }
  };

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
    a.download = 'scanned_servers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Scanned Servers
        </Typography>
        <ScanButton 
          onClick={handleScan}
          label="Scan Servers"
        />
      </Box>
      
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
