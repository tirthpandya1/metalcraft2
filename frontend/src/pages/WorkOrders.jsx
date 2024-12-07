import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Check as CompleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const steps = ['Pending', 'In Progress', 'Quality Check', 'Completed'];

// Mock data - replace with actual API data
const mockWorkOrders = [
  {
    id: 1,
    orderNumber: 'WO-2024-001',
    product: 'Metal Cabinet Type A',
    quantity: 5,
    status: 'In Progress',
    customer: 'ABC Corporation',
    dueDate: '2024-12-15',
    priority: 'High',
    currentStep: 1,
  },
  {
    id: 2,
    orderNumber: 'WO-2024-002',
    product: 'Custom Railing',
    quantity: 3,
    status: 'Pending',
    customer: 'XYZ Industries',
    dueDate: '2024-12-20',
    priority: 'Medium',
    currentStep: 0,
  },
  {
    id: 3,
    orderNumber: 'WO-2024-003',
    product: 'Industrial Shelf',
    quantity: 10,
    status: 'Completed',
    customer: 'Local Hardware Store',
    dueDate: '2024-12-05',
    priority: 'Low',
    currentStep: 3,
  },
];

function WorkOrders() {
  const [workOrders, setWorkOrders] = useState(mockWorkOrders);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'delayed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredOrders = workOrders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Work Orders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {/* Add new work order logic */}}
        >
          Create Work Order
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search work orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.product}</TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.priority}
                    color={getPriorityColor(order.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.dueDate}</TableCell>
                <TableCell sx={{ minWidth: 200 }}>
                  <Stepper activeStep={order.currentStep} alternativeLabel size="small">
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => {/* Edit order logic */}}
                  >
                    <EditIcon />
                  </IconButton>
                  {order.status === 'Pending' && (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {/* Start order logic */}}
                    >
                      <StartIcon />
                    </IconButton>
                  )}
                  {order.status === 'In Progress' && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {/* Stop order logic */}}
                    >
                      <StopIcon />
                    </IconButton>
                  )}
                  {order.status === 'Quality Check' && (
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => {/* Complete order logic */}}
                    >
                      <CompleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default WorkOrders;
