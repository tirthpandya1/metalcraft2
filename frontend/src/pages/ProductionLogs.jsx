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

  const fetchProductionLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = { 
        page: pageNum, 
        ordering: order === 'desc' ? `-${orderBy}` : orderBy,
        search: searchTerm
      };
      const response = await productionLogService.getAll(params);
      
      setLogs(response.results);
      setFilteredLogs(response.results);
      setTotalPages(Math.ceil(response.count / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching production logs:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionLogs();
  }, [orderBy, order, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchProductionLogs(newPage);
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
