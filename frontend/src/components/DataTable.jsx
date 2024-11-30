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
  Box,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function DataTable({ data, columns, onExportCsv }) {
  const theme = useTheme();
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleStatusFilter = (event, newFilter) => {
    if (newFilter !== null) {
      setStatusFilter(newFilter);
    }
  };

  const getBackgroundColor = (row) => {
    if (!row.backup_status) return 'inherit';
    const isDark = theme.palette.mode === 'dark';
    
    switch (row.backup_status) {
      case 'green': 
        return isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9';
      case 'yellow': 
        return isDark ? 'rgba(237, 108, 2, 0.2)' : '#fff3e0';
      case 'red': 
        return isDark ? 'rgba(211, 47, 47, 0.2)' : '#ffebee';
      default: 
        return 'inherit';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'green': return '#2e7d32';
      case 'yellow': return '#ed6c02';
      case 'red': return '#d32f2f';
      default: return '#000000';
    }
  };

  const handleExportExcel = () => {
    // Create worksheet data with current sort and filter
    const sortedAndFilteredData = filterData(sortData(data));
    
    // Convert data to Excel format
    const wsData = [
      columns.map(col => col.headerName), // Headers
      ...sortedAndFilteredData.map(row => 
        columns.map(col => {
          if (col.valueFormatter) {
            return col.valueFormatter(row[col.field]);
          }
          return row[col.field];
        })
      )
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Add cell styling
    const statusColumnIndex = columns.findIndex(col => col.field === 'backup_status');
    if (statusColumnIndex !== -1) {
      // Skip header row
      for (let rowIndex = 1; rowIndex < sortedAndFilteredData.length + 1; rowIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: statusColumnIndex });
        const row = sortedAndFilteredData[rowIndex - 1];
        const backgroundColor = getBackgroundColor(row).replace('rgba', 'rgb').replace(/, 0.2\)/, ')');
        
        if (!ws[cellRef]) ws[cellRef] = {};
        ws[cellRef].s = {
          fill: { fgColor: { rgb: backgroundColor.replace('#', '') } },
          font: { color: { rgb: getStatusColor(row.backup_status).replace('#', '') } }
        };
      }
    }

    // Set column widths
    const colWidths = columns.map(col => ({
      wch: Math.max(
        (col.headerName || '').length,
        ...sortedAndFilteredData.map(row => 
          String(row[col.field] || '').length
        )
      )
    }));
    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Backup Status');

    // Generate Excel file
    XLSX.writeFile(wb, 'backup_status.xlsx');
  };

  const sortData = (data) => {
    if (!orderBy) return data;

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.field === orderBy);
      let aValue = column?.valueGetter ? column.valueGetter(a) : a[orderBy];
      let bValue = column?.valueGetter ? column.valueGetter(b) : b[orderBy];

      // Handle undefined/null values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return order === 'asc' ? result : -result;
    });
  };

  const filterData = (data) => {
    if (statusFilter === 'all') return data;
    return data.filter(row => row.backup_status === statusFilter);
  };

  const sortedAndFilteredData = filterData(sortData(data));

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={handleStatusFilter}
          aria-label="status filter"
          size="small"
        >
          <ToggleButton value="all">
            All
          </ToggleButton>
          <ToggleButton value="green" sx={{ color: theme.palette.success.main }}>
            Good
          </ToggleButton>
          <ToggleButton value="yellow" sx={{ color: theme.palette.warning.main }}>
            Warning
          </ToggleButton>
          <ToggleButton value="red" sx={{ color: theme.palette.error.main }}>
            Error
          </ToggleButton>
        </ToggleButtonGroup>
        <Button 
          variant="outlined" 
          onClick={handleExportExcel}
          sx={{ ml: 2 }}
        >
          Export Excel
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  sortDirection={orderBy === column.field ? order : false}
                  sx={{ 
                    fontWeight: 600,
                    width: column.width
                  }}
                >
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
            {sortedAndFilteredData.map((row, index) => (
              <TableRow 
                key={row.id || index}
                sx={{ 
                  backgroundColor: getBackgroundColor(row),
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={column.field}
                    sx={{
                      width: column.width
                    }}
                  >
                    {column.renderCell ? (
                      column.renderCell(row)
                    ) : column.valueFormatter ? (
                      column.valueFormatter(row[column.field])
                    ) : (
                      row[column.field]
                    )}
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
