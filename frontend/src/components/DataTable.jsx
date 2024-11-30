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

export default function DataTable({ data, columns, onExportCsv, defaultSort }) {
  const theme = useTheme();
  const [orderBy, setOrderBy] = useState(defaultSort?.field || '');
  const [order, setOrder] = useState(defaultSort?.order || 'asc');
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

  const getCellValue = (row, column) => {
    if (column.valueGetter) {
      return column.valueGetter(row);
    }
    return row[column.field];
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
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={handleStatusFilter}
          aria-label="status filter"
          size="small"
        >
          <ToggleButton 
            value="all" 
            sx={{ 
              textTransform: 'none',
              px: 2,
            }}
          >
            All
          </ToggleButton>
          <ToggleButton 
            value="green"
            sx={{ 
              textTransform: 'none',
              px: 2,
              '&.Mui-selected': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.3)' : '#e8f5e9',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.4)' : '#c8e6c9'
                }
              }
            }}
          >
            Good
          </ToggleButton>
          <ToggleButton 
            value="yellow"
            sx={{ 
              textTransform: 'none',
              px: 2,
              '&.Mui-selected': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.3)' : '#fff3e0',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.4)' : '#ffe0b2'
                }
              }
            }}
          >
            Warning
          </ToggleButton>
          <ToggleButton 
            value="red"
            sx={{ 
              textTransform: 'none',
              px: 2,
              '&.Mui-selected': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.3)' : '#ffebee',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.4)' : '#ffcdd2'
                }
              }
            }}
          >
            Error
          </ToggleButton>
        </ToggleButtonGroup>
        <Button 
          variant="contained" 
          onClick={onExportCsv}
          sx={{ ml: 2 }}
        >
          Export CSV
        </Button>
      </Box>
      <TableContainer 
        component={Paper}
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell 
                  key={column.field}
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
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
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={column.field}
                    sx={{
                      color: theme.palette.text.primary,
                    }}
                  >
                    {column.renderCell ? column.renderCell(row) : (
                      column.valueFormatter 
                        ? column.valueFormatter(row[column.field])
                        : row[column.field]
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
