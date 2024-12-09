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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const WorkstationProcesses = () => {
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const response = await axios.get('/api/workstation-processes/');
        setProcesses(response.data);
      } catch (error) {
        console.error('Error fetching workstation processes:', error);
      }
    };

    fetchProcesses();
  }, []);

  const handleViewDetails = (process) => {
    setSelectedProcess(process);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProcess(null);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Workstation Processes
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Workstation</TableCell>
              <TableCell>Process Type</TableCell>
              <TableCell>Sequence Order</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processes.map((process) => (
              <StyledTableRow key={process.id}>
                <TableCell>{process.product_name}</TableCell>
                <TableCell>{process.workstation_name}</TableCell>
                <TableCell>{process.process_type}</TableCell>
                <TableCell>{process.sequence_order}</TableCell>
                <TableCell>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => handleViewDetails(process)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Process Details</DialogTitle>
        <DialogContent>
          {selectedProcess && (
            <Box>
              <Typography variant="subtitle1">Estimated Time: {selectedProcess.estimated_time}</Typography>
              <Typography variant="subtitle1">Instruction Set:</Typography>
              <pre>{JSON.stringify(selectedProcess.instruction_set, null, 2)}</pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkstationProcesses;
