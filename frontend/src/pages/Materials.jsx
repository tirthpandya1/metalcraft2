import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';

// Mock data - replace with actual API data
const mockMaterials = [
  {
    id: 1,
    name: 'Steel Sheet A36',
    quantity: 500,
    unit: 'sheets',
    status: 'In Stock',
    reorderPoint: 100,
    location: 'Warehouse A-1',
  },
  {
    id: 2,
    name: 'Aluminum Rod 6061',
    quantity: 250,
    unit: 'rods',
    status: 'Low Stock',
    reorderPoint: 300,
    location: 'Warehouse B-2',
  },
  {
    id: 3,
    name: 'Copper Wire',
    quantity: 1000,
    unit: 'meters',
    status: 'In Stock',
    reorderPoint: 200,
    location: 'Warehouse A-3',
  },
];

function Materials() {
  const [materials, setMaterials] = useState(mockMaterials);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'in stock':
        return 'success';
      case 'low stock':
        return 'warning';
      case 'out of stock':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Materials Inventory</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {/* Add new material logic */}}
        >
          Add Material
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search materials..."
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
              <TableCell>Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reorder Point</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMaterials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>{material.name}</TableCell>
                <TableCell>{material.quantity}</TableCell>
                <TableCell>{material.unit}</TableCell>
                <TableCell>
                  <Chip
                    label={material.status}
                    color={getStatusColor(material.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{material.reorderPoint}</TableCell>
                <TableCell>{material.location}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => {/* Edit material logic */}}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {/* Delete material logic */}}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Materials;
