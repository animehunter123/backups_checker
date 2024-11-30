import { useEffect, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import DataTable from '../components/DataTable';
import ScanButton from '../components/ScanButton';
import { getFiles, scanDirectories } from '../api';

const columns = [
  { field: 'filename', headerName: 'Filename' },
  { field: 'filepath', headerName: 'Path' },
  { 
    field: 'size', 
    headerName: 'Size',
    valueFormatter: (value) => {
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = value;
      let i = 0;
      while (size >= 1024 && i < sizes.length - 1) {
        size /= 1024;
        i++;
      }
      return `${size.toFixed(2)} ${sizes[i]}`;
    }
  },
  { 
    field: 'last_modified', 
    headerName: 'Last Modified',
    valueFormatter: (value) => new Date(value).toLocaleString()
  },
  { 
    field: 'scan_time', 
    headerName: 'Scan Time',
    valueFormatter: (value) => new Date(value).toLocaleString()
  }
];

export default function Directories() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const fetchFiles = async () => {
    try {
      const response = await getFiles();
      setFiles(response.files);
      setError(null);
    } catch (err) {
      setError('Failed to fetch file data');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleScan = async () => {
    try {
      await scanDirectories();
      await fetchFiles();
      setError(null);
    } catch (err) {
      setError('Failed to scan directories');
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    const headers = columns.map(col => col.headerName).join(',');
    const rows = files.map(file => 
      columns.map(col => {
        const value = file[col.field];
        return col.valueFormatter ? col.valueFormatter(value) : value;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scanned_files.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Scanned Directories
        </Typography>
        <ScanButton 
          onClick={handleScan}
          label="Scan Directories"
        />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable 
        data={files}
        columns={columns}
        onExportCsv={handleExportCsv}
      />
    </Box>
  );
}
