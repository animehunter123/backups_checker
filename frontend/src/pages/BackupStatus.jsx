import { useEffect, useState } from 'react';
import { Box, Typography, Alert, Chip } from '@mui/material';
import DataTable from '../components/DataTable';
import { getServers, getFiles } from '../api';

const getStatusInfo = (status) => {
  switch (status) {
    case 'green':
      return { label: 'Good', color: 'success', sortValue: 3 };
    case 'yellow':
      return { label: 'Warning', color: 'warning', sortValue: 2 };
    case 'red':
      return { label: 'Error', color: 'error', sortValue: 1 };
    default:
      return { label: 'Unknown', color: 'default', sortValue: 0 };
  }
};

const findMatchingFile = (server, files) => {
  const serverIdentifiers = [
    server.hostname?.toLowerCase(),
    server.ip_address?.toLowerCase()
  ].filter(Boolean);

  return files.find(file => {
    const filename = file.filename.toLowerCase();
    return serverIdentifiers.some(id => filename.includes(id));
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const columns = [
  { field: 'hostname', headerName: 'Hostname' },
  { field: 'ip_address', headerName: 'IP Address' },
  { field: 'detected_os', headerName: 'OS' },
  { field: 'filename', headerName: 'Backup File' },
  { 
    field: 'backup_time', 
    headerName: 'Backup Time',
    valueFormatter: (value) => formatDateTime(value)
  },
  { 
    field: 'status_label', 
    headerName: 'Status',
    valueGetter: (row) => getStatusInfo(row.backup_status).sortValue,
    renderCell: (row) => {
      const statusInfo = getStatusInfo(row.backup_status);
      return (
        <Chip 
          label={statusInfo.label} 
          color={statusInfo.color}
          size="small"
          sx={{ 
            minWidth: 70,
            fontWeight: 500
          }}
        />
      );
    }
  },
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
    valueFormatter: (value) => formatDateTime(value)
  }
];

export default function BackupStatus() {
  const [servers, setServers] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [serversResponse, filesResponse] = await Promise.all([
        getServers(),
        getFiles()
      ]);

      // Add status_label and filename fields
      const serversWithExtra = serversResponse.servers.map(server => {
        const matchingFile = findMatchingFile(server, filesResponse.files);
        return {
          ...server,
          status_label: getStatusInfo(server.backup_status).sortValue,
          filename: matchingFile?.filename || '',
          backup_time: matchingFile?.last_modified || ''
        };
      });

      setServers(serversWithExtra);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCsv = () => {
    const headers = columns.map(col => col.headerName).join(',');
    const rows = servers.map(server => 
      columns.map(col => {
        if (col.valueFormatter) {
          return col.valueFormatter(server[col.field]);
        }
        if (col.field === 'status_label') {
          return getStatusInfo(server.backup_status).label;
        }
        return server[col.field];
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

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Server Backup Status
      </Typography>
      
      <DataTable 
        data={servers}
        columns={columns}
        onExportCsv={handleExportCsv}
      />
    </Box>
  );
}
