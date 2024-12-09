import React, { useState, useEffect } from 'react';
import axios from '../services/axiosConfig';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  LinearProgress,
  Tooltip,
  TextField,
  MenuItem
} from '@mui/material';
import { 
  Build as BuildIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import WorkstationSequenceComponent from '../components/WorkstationSequenceComponent';

const ProductCard = ({ product, onEdit, onDelete, onProductSelect }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'IN_STOCK': return 'success';
      case 'LOW_STOCK': return 'warning';
      case 'OUT_OF_STOCK': return 'error';
      case 'DISCONTINUED': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'IN_STOCK': return <CheckCircleIcon color="success" />;
      case 'LOW_STOCK': return <WarningIcon color="warning" />;
      case 'OUT_OF_STOCK': return <ErrorIcon color="error" />;
      case 'DISCONTINUED': return <DeleteIcon color="default" />;
      default: return <InventoryIcon />;
    }
  };

  const [showWorkstationSequence, setShowWorkstationSequence] = useState(false);

  const handleOpenWorkstationSequence = (e) => {
    e.stopPropagation();
    setShowWorkstationSequence(true);
  };

  const handleCloseWorkstationSequence = () => {
    setShowWorkstationSequence(false);
  };

  return (
    <>
      <Card 
        variant="outlined" 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between' 
        }}
        onClick={() => onProductSelect(product)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {product.name}
            </Typography>
            {getStatusIcon(product.stock_status)}
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {product.description || 'No description available'}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Chip 
              label={product.stock_status_display} 
              color={
                product.stock_status === 'OUT_OF_STOCK' ? 'error' : 
                product.stock_status === 'LOW_STOCK' ? 'warning' : 
                'success'
              }
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption">
              Materials: {product.materials ? product.materials.length : 0}
            </Typography>
            <Typography variant="caption">
              Quantity: {product.current_quantity} / {product.max_stock_level}
            </Typography>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            Created: {new Date(product.created_at).toLocaleDateString()}
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleOpenWorkstationSequence}
            sx={{ mt: 2 }}
          >
            View Workstation Sequence
          </Button>
        </CardContent>
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Tooltip title="Edit Product">
            <IconButton size="small" onClick={onEdit}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Product">
            <IconButton size="small" onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Card>

      {showWorkstationSequence && (
        <WorkstationSequenceComponent 
          productId={product.id} 
          onClose={handleCloseWorkstationSequence} 
          editable={true}
        />
      )}
    </>
  );
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products/');
      
      // Detailed debugging
      console.group('Products Fetch');
      console.log('Raw Response:', response);
      console.log('Response Data:', response.data);
      console.log('Data Type:', typeof response.data);
      console.log('Is Array:', Array.isArray(response.data));
      
      // Ensure products is always an array
      const productData = Array.isArray(response.data) ? response.data : 
                          (response.data.results ? response.data.results : []);
      
      console.log('Processed Products:', productData);
      console.groupEnd();

      setProducts(productData);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.error || 
                           'Failed to fetch products';
      
      // Detailed error logging
      console.group('Products Fetch Error');
      console.error('Full Error:', err);
      console.error('Error Response:', err.response);
      console.error('Error Message:', errorMessage);
      console.groupEnd();

      setError(errorMessage);
      // Set to empty array to prevent map error
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    try {
      await axios.delete(`/api/products/${productId}/`);
      fetchProducts();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.error || 
                           'Failed to delete product';
      setError(errorMessage);
      console.error('Product delete error:', err);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleSave = async () => {
    try {
      if (selectedProduct.id) {
        await axios.put(`/api/products/${selectedProduct.id}/`, selectedProduct);
      } else {
        await axios.post('/api/products/', selectedProduct);
      }
      fetchProducts();
      handleDialogClose();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.error || 
                           'Failed to save product';
      setError(errorMessage);
      console.error('Product save error:', err);
    }
  };

  const handleProductSelect = (product) => {
    console.log('Product selected:', product);
  };

  return (
    <Box sx={{ p: 3 }}>
      {loading && <LinearProgress />}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Button 
          variant="contained" 
          startIcon={<BuildIcon />}
          onClick={() => {
            setSelectedProduct({ 
              name: '', 
              description: '', 
              current_quantity: 0, 
              restock_level: 10, 
              max_stock_level: 100,
              materials: [] 
            });
            setIsDialogOpen(true);
          }}
        >
          Add Product
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <ProductCard 
              product={product} 
              onEdit={() => handleEdit(product)} 
              onDelete={() => handleDelete(product.id)} 
              onProductSelect={handleProductSelect}
            />
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={isDialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle>
          {selectedProduct?.id ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={selectedProduct?.name || ''}
            onChange={(e) => setSelectedProduct(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={selectedProduct?.description || ''}
            onChange={(e) => setSelectedProduct(prev => ({ ...prev, description: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Current Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={selectedProduct?.current_quantity || 0}
            onChange={(e) => setSelectedProduct(prev => ({ ...prev, current_quantity: parseInt(e.target.value) || 0 }))}
          />
          <TextField
            margin="dense"
            label="Restock Level"
            type="number"
            fullWidth
            variant="outlined"
            value={selectedProduct?.restock_level || 10}
            onChange={(e) => setSelectedProduct(prev => ({ ...prev, restock_level: parseInt(e.target.value) || 10 }))}
          />
          <TextField
            margin="dense"
            label="Max Stock Level"
            type="number"
            fullWidth
            variant="outlined"
            value={selectedProduct?.max_stock_level || 100}
            onChange={(e) => setSelectedProduct(prev => ({ ...prev, max_stock_level: parseInt(e.target.value) || 100 }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSave} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
