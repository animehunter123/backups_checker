import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TableSortLabel,
  Button,
  Box
} from '@mui/material';
import { useState } from 'react';

export default function DataTable({ data, columns, onExportCsv }) {
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);

    const sortedData = [...data].sort((a, b) => {
      if (!a[property]) return 1;
      if (!b[property]) return -1;
      
      const comparison = a[property].toString().localeCompare(b[property].toString());
      return isAsc ? -comparison : comparison;
    });
  };

  const getBackgroundColor = (row) => {
    if (!row.backup_status) return 'inherit';
    switch (row.backup_status) {
      case 'green': return '#e8f5e9';  // light green
      case 'yellow': return '#fff3e0'; // light yellow
      case 'red': return '#ffebee';    // light red
      default: return 'inherit';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={onExportCsv}
          sx={{ mr: 1 }}
        >
          Export CSV
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.field}>
                  <TableSortLabel
                    active={orderBy === column.field}
                    direction={orderBy === column.field ? order : 'asc'}
                    onClick={() => handleSort(column.field)}
                  >
                    {column.headerName}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow 
                key={row.id || index}
                sx={{ backgroundColor: getBackgroundColor(row) }}
              >
                {columns.map((column) => (
                  <TableCell key={column.field}>
                    {column.valueFormatter 
                      ? column.valueFormatter(row[column.field])
                      : row[column.field]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
