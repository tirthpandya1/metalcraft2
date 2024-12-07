import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

// Mock data - replace with actual API data
const mockProducts = [
  {
    id: 1,
    name: 'Metal Cabinet Type A',
    sku: 'CAB-001',
    category: 'Storage',
    status: 'Active',
    leadTime: '5 days',
    materials: ['Steel Sheet A36', 'Hinges', 'Lock Mechanism'],
    price: 599.99,
  },
  {
    id: 2,
    name: 'Custom Railing',
    sku: 'RAIL-002',
    category: 'Construction',
    status: 'Active',
    leadTime: '7 days',
    materials: ['Aluminum Rod 6061', 'Mounting Brackets'],
    price: 299.99,
  },
  {
    id: 3,
    name: 'Industrial Shelf',
    sku: 'SHELF-003',
    category: 'Storage',
    status: 'Discontinued',
    leadTime: '3 days',
    materials: ['Steel Sheet A36', 'Bolts', 'Corner Brackets'],
    price: 199.99,
  },
];

function Products() {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'discontinued':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {/* Add new product logic */}}
        >
          Add Product
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search products..."
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

      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {product.name}
                  </Typography>
                  <Chip
                    label={product.status}
                    color={getStatusColor(product.status)}
                    size="small"
                  />
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  SKU: {product.sku}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  Category: {product.category}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  Lead Time: {product.leadTime}
                </Typography>
                <Typography variant="h6" color="primary">
                  ${product.price}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Materials Required:
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {product.materials.map((material, index) => (
                    <Chip
                      key={index}
                      label={material}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => {/* View product details logic */}}
                >
                  View Details
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => {/* Edit product logic */}}
                >
                  Edit
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Products;
