import React, { useState, useEffect, useMemo } from 'react';
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
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import WorkstationSequenceComponent from '../components/WorkstationSequenceComponent';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const WorkstationProcesses = () => {
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  // Filtering and Sorting States
  const [productFilter, setProductFilter] = useState('');
  const [workstationFilter, setWorkstationFilter] = useState('');
  const [processTypeFilter, setProcessTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('sequence_order');

  // Unique filter options
  const [productOptions, setProductOptions] = useState([]);
  const [workstationOptions, setWorkstationOptions] = useState([]);
  const [processTypeOptions, setProcessTypeOptions] = useState([]);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const [processResponse, productResponse, workstationResponse] = await Promise.all([
          axios.get('/api/workstation-processes/'),
          axios.get('/api/products/'),
          axios.get('/api/workstations/')
        ]);
        
        const processData = Array.isArray(processResponse.data) ? processResponse.data : 
                             (processResponse.data.results ? processResponse.data.results : []);
        
        setProcesses(processData);

        // Extract unique filter options
        const uniqueProducts = [...new Set(processData.map(p => p.product_name))];
        const uniqueWorkstations = [...new Set(processData.map(p => p.workstation_name))];
        const uniqueProcessTypes = [...new Set(processData.map(p => p.process_type))];

        setProductOptions(uniqueProducts);
        setWorkstationOptions(uniqueWorkstations);
        setProcessTypeOptions(uniqueProcessTypes);

      } catch (error) {
        console.error('Error fetching data:', error);
        setProcesses([]);
      }
    };

    fetchProcesses();
  }, []);

  // Memoized and filtered processes
  const filteredProcesses = useMemo(() => {
    return processes
      .filter(p => !productFilter || p.product_name === productFilter)
      .filter(p => !workstationFilter || p.workstation_name === workstationFilter)
      .filter(p => !processTypeFilter || p.process_type === processTypeFilter)
      .sort((a, b) => {
        switch(sortBy) {
          case 'estimated_time':
            return a.estimated_time - b.estimated_time;
          case 'sequence_order':
          default:
            return a.sequence_order - b.sequence_order;
        }
      });
  }, [processes, productFilter, workstationFilter, processTypeFilter, sortBy]);

  const handleViewDetails = (process) => {
    setSelectedProcess(process);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProcess(null);
  };

  const handleViewWorkstationSequence = (productId) => {
    setSelectedProductId(productId);
  };

  const handleCloseWorkstationSequence = () => {
    setSelectedProductId(null);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Workstation Processes
      </Typography>

      {/* Filtering and Sorting Controls */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Product Filter"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
          >
            <MenuItem value="">All Products</MenuItem>
            {productOptions.map(product => (
              <MenuItem key={product} value={product}>{product}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Workstation Filter"
            value={workstationFilter}
            onChange={(e) => setWorkstationFilter(e.target.value)}
          >
            <MenuItem value="">All Workstations</MenuItem>
            {workstationOptions.map(workstation => (
              <MenuItem key={workstation} value={workstation}>{workstation}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Process Type Filter"
            value={processTypeFilter}
            onChange={(e) => setProcessTypeFilter(e.target.value)}
          >
            <MenuItem value="">All Process Types</MenuItem>
            {processTypeOptions.map(processType => (
              <MenuItem key={processType} value={processType}>{processType}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="sequence_order">Sequence Order</MenuItem>
            <MenuItem value="estimated_time">Estimated Time</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Workstation</TableCell>
              <TableCell>Process Type</TableCell>
              <TableCell>Sequence Order</TableCell>
              <TableCell>Estimated Time (mins)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProcesses.map((process) => (
              <StyledTableRow key={process.id}>
                <TableCell>{process.product_name}</TableCell>
                <TableCell>{process.workstation_name}</TableCell>
                <TableCell>
                  <Chip 
                    label={process.process_type} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </TableCell>
                <TableCell>{process.sequence_order}</TableCell>
                <TableCell>{process.estimated_time} mins</TableCell>
                <TableCell>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => handleViewDetails(process)}
                  >
                    View Details
                  </Button>
                  {process.product && (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => handleViewWorkstationSequence(process.product)}
                      sx={{ ml: 1 }}
                    >
                      View Workstation Sequence
                    </Button>
                  )}
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
              <Typography variant="h6">{selectedProcess.product_name} - Process Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">
                    <strong>Workstation:</strong> {selectedProcess.workstation_name}
                  </Typography>
                  <Typography variant="subtitle1">
                    <strong>Process Type:</strong> {selectedProcess.process_type}
                  </Typography>
                  <Typography variant="subtitle1">
                    <strong>Sequence Order:</strong> {selectedProcess.sequence_order}
                  </Typography>
                  <Typography variant="subtitle1">
                    <strong>Estimated Time:</strong> {selectedProcess.estimated_time} mins
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">Instruction Set:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                    <pre>{JSON.stringify(selectedProcess.instruction_set, null, 2)}</pre>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {selectedProductId && (
        <WorkstationSequenceComponent 
          productId={selectedProductId} 
          onClose={handleCloseWorkstationSequence} 
        />
      )}
    </Box>
  );
};

export default WorkstationProcesses;
