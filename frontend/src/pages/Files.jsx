import { useEffect, useState } from 'react';
import { Box, Typography, Alert, Chip } from '@mui/material';
import DataTable from '../components/DataTable';
import { getFiles } from '../api';

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const columns = [
  { 
    field: 'filename',
    headerName: 'Filename',
    width: 300
  },
  { 
    field: 'filepath',
    headerName: 'Path',
    width: 400
  },
  {
    field: 'size',
    headerName: 'Size',
    valueFormatter: (value) => formatSize(value)
  },
  { 
    field: 'last_modified',
    headerName: 'Last Modified',
    valueFormatter: (value) => new Date(value).toLocaleString()
  }
];

export default function Files() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await getFiles();
      setFiles(response.files);
      setError(null);
    } catch (err) {
      setError('Failed to fetch files');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCsv = () => {
    const headers = columns.map(col => col.headerName).join(',');
    const rows = files.map(file => 
      columns.map(col => {
        if (col.valueFormatter) {
          return col.valueFormatter(file[col.field]);
        }
        return file[col.field];
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_files.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Backup Files</Typography>
      <DataTable 
        data={files} 
        columns={columns} 
        onExportCsv={handleExportCsv}
      />
    </Box>
  );
}
