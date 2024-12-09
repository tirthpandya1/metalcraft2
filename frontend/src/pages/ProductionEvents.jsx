import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  TablePagination
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const getEventColorAndVariant = (eventType) => {
  const eventColorMap = {
    'WORK_ORDER_CREATED': { color: 'primary', variant: 'outlined' },
    'WORK_ORDER_STARTED': { color: 'success', variant: 'outlined' },
    'WORK_ORDER_COMPLETED': { color: 'success', variant: 'contained' },
    'WORKSTATION_PROCESSING_STARTED': { color: 'info', variant: 'outlined' },
    'WORKSTATION_PROCESSING_COMPLETED': { color: 'info', variant: 'contained' },
    'MATERIAL_USED': { color: 'default', variant: 'outlined' },
    'MATERIAL_WASTED': { color: 'warning', variant: 'outlined' },
    'QUALITY_CHECK_PASSED': { color: 'success', variant: 'outlined' },
    'QUALITY_CHECK_FAILED': { color: 'error', variant: 'outlined' },
    'PACKAGING_STARTED': { color: 'secondary', variant: 'outlined' },
    'PACKAGING_COMPLETED': { color: 'secondary', variant: 'contained' },
  };

  return eventColorMap[eventType] || { color: 'default', variant: 'outlined' };
};

const ProductionEvents = () => {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('/api/production-events/event-timeline/', {
          params: {
            page: page + 1,
            page_size: rowsPerPage
          }
        });
        setEvents(response.data.events);
        setTotalEvents(response.data.total_events);
      } catch (error) {
        console.error('Error fetching production events:', error);
      }
    };

    fetchEvents();
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Production Event Timeline
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event Type</TableCell>
              <TableCell>Work Order</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Workstation</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => {
              const { color, variant } = getEventColorAndVariant(event.event_type);
              return (
                <StyledTableRow key={event.id}>
                  <TableCell>
                    <Chip 
                      label={event.event_type.replace(/_/g, ' ')} 
                      color={color} 
                      variant={variant} 
                    />
                  </TableCell>
                  <TableCell>{event.work_order}</TableCell>
                  <TableCell>{event.product}</TableCell>
                  <TableCell>{event.workstation || 'N/A'}</TableCell>
                  <TableCell>{new Date(event.created_at).toLocaleString()}</TableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalEvents}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default ProductionEvents;
