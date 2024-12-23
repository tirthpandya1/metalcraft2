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
  TextField, 
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  IconButton,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    add_materials: []
  });

  useEffect(() => {
    // Fetch suppliers and materials
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const suppliersResponse = await api.get('/suppliers/');
        const materialsResponse = await api.get('/materials/');
        
        console.log('Suppliers Response:', suppliersResponse);
        console.log('Materials Response:', materialsResponse);
        
        // Ensure we're getting an array from the nested response
        const materialsList = 
          materialsResponse.data.results || 
          materialsResponse.data.data?.results || 
          materialsResponse.data || 
          [];
        
        const suppliersList = 
          suppliersResponse.data.results || 
          suppliersResponse.data.data?.results || 
          suppliersResponse.data || 
          [];
        
        setSuppliers(suppliersList);
        setMaterials(materialsList);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddSupplier = async () => {
    try {
      console.log('Adding Supplier:', newSupplier);
      
      // Validate required fields
      if (!newSupplier.name || !newSupplier.email) {
        alert('Please fill in Name and Email fields');
        return;
      }

      // Validate materials if added
      if (newSupplier.add_materials && newSupplier.add_materials.length > 0) {
        const invalidMaterials = newSupplier.add_materials.filter(
          material => !material.material_id
        );
        
        if (invalidMaterials.length > 0) {
          alert('Please select a material for all added materials');
          return;
        }
      }

      const response = await api.post('/suppliers/', {
        name: newSupplier.name,
        contact_person: newSupplier.contact_person || '',
        email: newSupplier.email,
        phone: newSupplier.phone || '',
        address: newSupplier.address || '',
        add_materials: newSupplier.add_materials?.map(material => ({
          material_id: material.material_id,
          typical_lead_time: material.typical_lead_time || null,
          typical_price_per_unit: material.typical_price_per_unit || null,
          is_preferred_supplier: material.is_preferred_supplier ? 1 : 0
        })) || []
      });

      // Update suppliers list
      setSuppliers(prevSuppliers => [...prevSuppliers, response.data]);
      
      // Reset form
      setNewSupplier({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        add_materials: []
      });
      
      // Close dialog
      setOpenDialog(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
      
      // More detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        
        // Display user-friendly error message
        alert(`Failed to add supplier: ${
          error.response.data.detail || 
          error.response.data.message || 
          'Unknown error occurred'
        }`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        alert('No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', error.message);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleAddMaterial = () => {
    setNewSupplier(prev => ({
      ...prev,
      add_materials: [
        ...prev.add_materials, 
        { 
          material_id: '', 
          typical_lead_time: null, 
          typical_price_per_unit: null, 
          is_preferred_supplier: false 
        }
      ]
    }));
  };

  const updateMaterialField = (index, field, value) => {
    const updatedMaterials = [...newSupplier.add_materials];
    updatedMaterials[index][field] = value;
    setNewSupplier(prev => ({
      ...prev,
      add_materials: updatedMaterials
    }));
  };

  const editMaterial = (index, field, value) => {
    const updatedMaterials = [...newSupplier.add_materials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [field]: value
    };
    setNewSupplier(prev => ({
      ...prev,
      add_materials: updatedMaterials
    }));
  };

  const removeMaterial = (indexToRemove) => {
    setNewSupplier(prev => ({
      ...prev,
      add_materials: prev.add_materials.filter((_, index) => index !== indexToRemove)
    }));
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

      {isLoading ? (
        <Typography>Loading suppliers...</Typography>
      ) : error ? (
        <Typography color="error">
          Error loading suppliers: {error.message || 'Unknown error'}
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Supplied Materials</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.contact_person}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.address}</TableCell>
                    <TableCell>
                      {supplier.materials && supplier.materials.map((material) => (
                        <Chip 
                          key={material.material_id} 
                          label={`${material.material_name} (${material.material_unit})`} 
                          variant="outlined" 
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
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
            value={newSupplier.contact_person}
            onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})}
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
            label="Phone"
            fullWidth
            value={newSupplier.phone}
            onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            value={newSupplier.address}
            onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
          />

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="h6">Supplied Materials</Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleAddMaterial}
              sx={{ mb: 1 }}
            >
              Add Material
            </Button>

            {newSupplier.add_materials.map((materialEntry, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                <FormControl fullWidth>
                  <InputLabel>Material</InputLabel>
                  <Select
                    value={materialEntry.material_id || ''}
                    label="Material"
                    onChange={(e) => updateMaterialField(index, 'material_id', e.target.value)}
                  >
                    {materials.map((material) => (
                      <MenuItem key={material.id} value={material.id}>
                        {material.name} ({material.unit})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Lead Time (Days)"
                  type="number"
                  fullWidth
                  value={materialEntry.typical_lead_time || ''}
                  onChange={(e) => updateMaterialField(index, 'typical_lead_time', e.target.value)}
                  InputProps={{
                    inputProps: { 
                      min: 0,
                      step: 1
                    }
                  }}
                />
                <TextField
                  label="Price per Unit"
                  type="number"
                  fullWidth
                  value={materialEntry.typical_price_per_unit || ''}
                  onChange={(e) => updateMaterialField(index, 'typical_price_per_unit', e.target.value)}
                  InputProps={{
                    inputProps: { 
                      min: 0,
                      step: 0.01
                    },
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={materialEntry.is_preferred_supplier || false}
                      onChange={(e) => updateMaterialField(index, 'is_preferred_supplier', e.target.checked)}
                    />
                  }
                  label="Preferred"
                />
                <IconButton 
                  color="error" 
                  onClick={() => removeMaterial(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddSupplier} color="primary" variant="contained">
            Add Supplier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Suppliers;
