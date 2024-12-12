import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Paper, 
  TextField, 
  TableSortLabel,
  Grid,
  Button
} from '@mui/material';
import withErrorHandling from '../components/withErrorHandling';
import { formatDate } from '../utils/dateUtils';
import { productionLogService } from '../services/api';

function ProductionLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('timestamp');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(null);

  const fetchProductionLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      
      // Map frontend sorting keys to backend field names
      const sortingMap = {
        'timestamp': 'created_at',
        'work_order': 'work_order__id',
        'machine': 'workstation__name',
        'operation': 'work_order__product__name',
        'quantity_produced': 'quantity_produced',
        'notes': 'notes'
      };

      const mappedOrderBy = sortingMap[orderBy] || orderBy;
      
      const params = { 
        page: pageNum, 
        ordering: order === 'desc' ? `-${mappedOrderBy}` : mappedOrderBy,
        search: searchTerm,
        // Only send date if it's a valid date
        ...(dateFilter && dateFilter instanceof Date 
          ? { date: formatDate(dateFilter, 'yyyy-MM-dd') } 
          : {})
      };
      
      const response = await productionLogService.getAll(params);
      
      // Ensure the logs are sorted on the frontend as a fallback
      const sortedLogs = response.results.sort((a, b) => {
        const modifier = order === 'desc' ? -1 : 1;
        
        switch(orderBy) {
          case 'timestamp':
            // Ensure correct sorting for timestamps in both directions
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return modifier * (dateA.getTime() - dateB.getTime());
          case 'work_order':
            return modifier * (b.work_order.localeCompare(a.work_order));
          case 'machine':
            return modifier * (b.machine.localeCompare(a.machine));
          case 'operation':
            return modifier * (b.operation.localeCompare(a.operation));
          case 'quantity_produced':
            return modifier * (b.quantity_produced - a.quantity_produced);
          case 'notes':
            return modifier * (b.notes.localeCompare(a.notes));
          default:
            return 0;
        }
      });
      
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs);
      setTotalPages(Math.ceil(response.count / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching production logs:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionLogs(page);
  }, [page, orderBy, order, searchTerm, dateFilter]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleSort = (columnId) => {
    // If sorting the same column, toggle between asc and desc
    const newOrder = orderBy === columnId && order === 'desc' ? 'asc' : 'desc';
    
    // Update both orderBy and order states
    setOrderBy(columnId);
    setOrder(newOrder);
    
    // Reset to first page when sorting changes
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleDateFilterChange = (event) => {
    const selectedDate = event.target.value;
    
    // Convert string to Date object
    const dateObj = selectedDate ? new Date(selectedDate) : null;
    
    setDateFilter(dateObj);
    setPage(1);
  };

  // Helper function to format date for input field
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const renderTableHeader = () => {
    const headers = [
      { id: 'timestamp', label: 'Timestamp' },
      { id: 'work_order', label: 'Work Order' },
      { id: 'machine', label: 'Machine' },
      { id: 'operation', label: 'Operation' },
      { id: 'quantity_produced', label: 'Quantity Produced' },
      { id: 'notes', label: 'Notes' }
    ];

    return headers.map((header) => (
      <TableCell key={header.id}>
        <TableSortLabel
          active={orderBy === header.id}
          direction={orderBy === header.id ? order : 'asc'}
          onClick={() => handleSort(header.id)}
        >
          {header.label}
          {orderBy === header.id && (
            <Box component="span" sx={{ display: 'none' }}>
              {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
            </Box>
          )}
        </TableSortLabel>
      </TableCell>
    ));
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Production Logs
      </Typography>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search Logs"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by work order, machine, or status"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            label="Date Filter"
            type="date"
            value={formatDateForInput(dateFilter)}
            onChange={handleDateFilterChange}
            InputLabelProps={{
              shrink: true
            }}
            inputProps={{
              style: { 
                paddingTop: '16px',  // Create space for the label
              }
            }}
            sx={{
              '& .MuiInputLabel-root': {
                transform: 'translate(14px, -9px) scale(0.75)',
                paddingX: '4px',
                zIndex: 1,
                backgroundColor: 'transparent'
              },
              '& .MuiOutlinedInput-root': {
                paddingTop: '8px'
              }
            }}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {renderTableHeader()}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No production logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>{log.work_order}</TableCell>
                  <TableCell>{log.machine}</TableCell>
                  <TableCell>{log.operation}</TableCell>
                  <TableCell>{log.quantity_produced}</TableCell>
                  <TableCell>{log.notes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <Button
            key={pageNum}
            variant={page === pageNum ? 'contained' : 'outlined'}
            onClick={() => handlePageChange(pageNum)}
            sx={{ mx: 0.5 }}
          >
            {pageNum}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

export default withErrorHandling(ProductionLogs);
