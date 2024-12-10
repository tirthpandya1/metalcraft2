import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Tooltip, 
  IconButton,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  CardHeader,
  Divider
} from '@mui/material';
import { 
  Build as BuildIcon, 
  Edit as EditIcon, 
  Delete as DeleteItemIcon, 
  CheckCircle as CheckCircleIcon, 
  Warning as WarningIcon, 
  Error as ErrorIcon,
  Inventory as InventoryIcon,
  AddCircle as AddIcon
} from '@mui/icons-material';
import MaterialSelectionModal from '../components/MaterialSelectionModal';
import WorkstationSequenceComponent from '../components/WorkstationSequenceComponent';
import { formatLocalDateTime } from '../utils/timeUtils';

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
      case 'DISCONTINUED': return <DeleteItemIcon color="default" />;
      default: return <InventoryIcon />;
    }
  };

  return (
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
            label={product.stock_status_display || product.stock_status} 
            color={getStatusColor(product.stock_status)}
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
        
        {product.materials && product.materials.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Required Materials:
            </Typography>
            {product.materials.map((material, index) => (
              <Typography key={index} variant="caption" display="block">
                - {material.material_name || material.name} (Qty: {material.quantity})
              </Typography>
            ))}
          </Box>
        )}
        
        <Typography variant="caption" color="text.secondary">
          Created: {formatLocalDateTime(product.created_at)}
        </Typography>
      </CardContent>
      
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Tooltip title="Edit Product">
          <IconButton size="small" onClick={onEdit}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Product">
          <IconButton size="small" onClick={onDelete}>
            <DeleteItemIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

// Wrapper for Droppable to handle default props
const DroppableWrapper = ({ droppableId, children }) => (
  <Droppable droppableId={droppableId}>
    {(provided = { droppableProps: {}, innerRef: () => {}, placeholder: null }) => 
      children(provided)
    }
  </Droppable>
);

// Wrapper for Draggable to handle default props
const DraggableWrapper = ({ draggableId, index, children }) => (
  <Draggable draggableId={draggableId} index={index}>
    {(provided = { 
      draggableProps: {}, 
      dragHandleProps: {}, 
      innerRef: () => {} 
    }) => children(provided)}
  </Draggable>
);

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.group('Products Data Fetch');
        const [productsResponse, materialsResponse] = await Promise.all([
          axios.get('/api/products/'),
          axios.get('/api/materials/')
        ]);
        
        console.log('Products Response:', productsResponse.data);
        console.log('Materials Response:', materialsResponse.data);
        
        // Extract results from paginated responses
        const productData = productsResponse.data.results || productsResponse.data;
        const materialsData = materialsResponse.data.results || materialsResponse.data;
        
        setProducts(productData);
        setMaterials(materialsData);
        
        console.log('Products State:', productData);
        console.log('Materials State:', materialsData);
        console.groupEnd();
        
        setLoading(false);
      } catch (err) {
        console.error('Fetch Error:', err);
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.group('Materials State Debug');
    console.log('Current Materials:', materials);
    console.log('Materials Type:', typeof materials);
    console.log('Is Array:', Array.isArray(materials));
    console.log('Materials Length:', materials?.length);
    console.groupEnd();
  }, [materials]);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    try {
      await axios.delete(`/api/products/${productId}/`);
      setProducts(products.filter(product => product.id !== productId));
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

  const handleSaveProduct = async () => {
    try {
      // Prepare product data
      const productData = {
        ...selectedProduct,
        // Convert materials to productmaterial_set format
        productmaterial_set: (selectedProduct.materials || []).map(material => ({
          material_id: material.material_id || material.id,
          quantity: material.quantity
        }))
      };

      // Remove unnecessary fields
      delete productData.materials;

      // Determine if this is a create or update operation
      if (selectedProduct.id) {
        // Update existing product
        await axios.put(`/api/products/${selectedProduct.id}/`, productData);
      } else {
        // Create new product
        await axios.post('/api/products/', productData);
      }

      // Refresh products list
      const response = await axios.get('/api/products/');
      setProducts(response.data.results || response.data);
      
      // Close dialog
      handleDialogClose();
    } catch (err) {
      console.error('Error saving product:', err);
      // Handle error (show error message, etc.)
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.error || 
                           'Failed to save product';
      
      // You might want to set an error state to show to the user
      setError(errorMessage);
    }
  };

  const handleProductSelect = (product) => {
    console.log('Product selected:', product);
  };

  const handleAddMaterial = (selectedMaterial, quantity) => {
    setSelectedProduct(prev => ({
      ...prev,
      materials: [...(prev.materials || []), { 
        material_id: selectedMaterial.id, 
        material_name: selectedMaterial.name, 
        quantity: quantity 
      }]
    }));
    setShowMaterialModal(false);
  };

  const handleRemoveMaterial = (materialIndex) => {
    setSelectedProduct(prev => ({
      ...prev,
      materials: prev.materials.filter((_, index) => index !== materialIndex)
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedMaterials = Array.from(selectedProduct.materials || []);
    const [reorderedItem] = reorderedMaterials.splice(result.source.index, 1);
    reorderedMaterials.splice(result.destination.index, 0, reorderedItem);

    setSelectedProduct(prev => ({
      ...prev,
      materials: reorderedMaterials
    }));
  };

  const renderProductCard = (product) => (
    <ProductCard 
      product={product} 
      onEdit={() => handleEdit(product)} 
      onDelete={() => handleDelete(product.id)} 
      onProductSelect={handleProductSelect}
    />
  );

  return (
    <Box sx={{ p: 3 }}>
      {loading && <LinearProgress />}
      {error && <Typography color="error">Error loading products</Typography>}
      
      <Grid container spacing={3}>
        {products.map(product => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            {renderProductCard(product)}
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={isDialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedProduct ? 'Edit Product' : 'Create New Product'}
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
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Required Materials
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => setShowMaterialModal(true)}
            startIcon={<AddIcon />}
          >
            Add Material
          </Button>

          <DragDropContext onDragEnd={onDragEnd}>
            <DroppableWrapper droppableId="materials-list">
              {(providedDroppable) => (
                <List 
                  {...providedDroppable.droppableProps} 
                  ref={providedDroppable.innerRef}
                >
                  {(selectedProduct?.materials || []).map((material, index) => (
                    <DraggableWrapper 
                      key={`material-${material.material_id}-${index}`} 
                      draggableId={`material-${material.material_id}`} 
                      index={index}
                    >
                      {(providedDraggable) => (
                        <ListItem
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              onClick={() => handleRemoveMaterial(index)}
                            >
                              <DeleteItemIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText 
                            primary={material.material_name || material.name} 
                            secondary={`Quantity: ${material.quantity}`} 
                          />
                        </ListItem>
                      )}
                    </DraggableWrapper>
                  ))}
                  {providedDroppable.placeholder}
                </List>
              )}
            </DroppableWrapper>
          </DragDropContext>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSaveProduct} color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {showMaterialModal && (
        <MaterialSelectionModal 
          open={showMaterialModal}
          materials={materials}
          onClose={() => setShowMaterialModal(false)}
          onAddMaterial={handleAddMaterial}
        />
      )}
    </Box>
  );
}
