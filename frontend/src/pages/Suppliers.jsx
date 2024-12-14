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
  DialogActions, 
  TextField 
} from '@mui/material';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    // TODO: Replace with actual API call to fetch suppliers
    const mockSuppliers = [
      { id: 1, name: 'Steel Dynamics', contact: 'John Doe', email: 'john@steeldynamics.com', address: '123 Metal Road' },
      { id: 2, name: 'Aluminum Co', contact: 'Jane Smith', email: 'jane@aluminumco.com', address: '456 Alloy Street' }
    ];
    setSuppliers(mockSuppliers);
  }, []);

  const handleAddSupplier = () => {
    // TODO: Replace with actual API call to add supplier
    setSuppliers([...suppliers, { ...newSupplier, id: suppliers.length + 1 }]);
    setOpenDialog(false);
    setNewSupplier({ name: '', contact: '', email: '', address: '' });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Suppliers
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 2 }}
      >
        Add New Supplier
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.contact}</TableCell>
                <TableCell>{supplier.email}</TableCell>
                <TableCell>{supplier.address}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Supplier Name"
            fullWidth
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Contact Person"
            fullWidth
            value={newSupplier.contact}
            onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newSupplier.email}
            onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            value={newSupplier.address}
            onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddSupplier} color="primary">
            Add Supplier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Suppliers;
