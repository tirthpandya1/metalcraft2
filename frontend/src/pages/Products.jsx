import React, { useState } from 'react';
import { Chip, MenuItem, TextField, Button, List, ListItem, ListItemText, IconButton, Dialog } from '@mui/material';
import { productService } from '../services/api';
import { withCrudList } from '../components/CrudListPage';
import { handleApiError, withErrorHandling } from '../utils/errorHandler';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Grid, Card, CardContent, CardActions, Typography, Box, Tooltip } from '@mui/material';
import WorkstationSequenceComponent from '../components/WorkstationSequenceComponent';
import MaterialSelectionModal from '../components/MaterialSelectionModal';

// Product Form Component
function ProductForm({ item, onItemChange, materials = [] }) {
  const [localMaterials, setLocalMaterials] = useState(item.materials || []);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const handleAddMaterial = (material, quantity) => {
    const newMaterial = {
      material_id: material.id,
      material_name: material.name,
      quantity: quantity
    };
    const updatedMaterials = [...localMaterials, newMaterial];
    setLocalMaterials(updatedMaterials);
    onItemChange(prev => ({
      ...prev,
      materials: updatedMaterials
    }));
    setShowMaterialModal(false);
  };

  const handleRemoveMaterial = (indexToRemove) => {
    const updatedMaterials = localMaterials.filter((_, index) => index !== indexToRemove);
    setLocalMaterials(updatedMaterials);
    onItemChange(prev => ({
      ...prev,
      materials: updatedMaterials
    }));
  };

  return (
    <>
      <TextField
        fullWidth
        margin="normal"
        label="Name"
        value={item.name || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          name: e.target.value
        }))}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Description"
        multiline
        rows={3}
        value={item.description || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          description: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Category"
        select
        value={item.category || 'STANDARD'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          category: e.target.value
        }))}
      >
        {[
          { value: 'STANDARD', label: 'Standard Product' },
          { value: 'CUSTOM', label: 'Custom Product' },
          { value: 'PROTOTYPE', label: 'Prototype' }
        ].map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        margin="normal"
        label="Unit Price"
        type="number"
        value={item.unit_price || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          unit_price: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Current Quantity"
        type="number"
        value={item.current_quantity || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          current_quantity: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Max Stock Level"
        type="number"
        value={item.max_stock_level || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          max_stock_level: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Stock Status"
        select
        value={item.stock_status || 'IN_STOCK'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          stock_status: e.target.value
        }))}
      >
        {[
          { value: 'IN_STOCK', label: 'In Stock' },
          { value: 'LOW_STOCK', label: 'Low Stock' },
          { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
          { value: 'DISCONTINUED', label: 'Discontinued' }
        ].map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {/* Materials Section */}
      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1">Required Materials</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => setShowMaterialModal(true)}
          startIcon={<AddIcon />}
        >
          Add Material
        </Button>
      </Box>

      {localMaterials.length > 0 ? (
        <List>
          {localMaterials.map((material, index) => (
            <ListItem 
              key={index} 
              secondaryAction={
                <IconButton 
                  edge="end" 
                  color="error" 
                  onClick={() => handleRemoveMaterial(index)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText 
                primary={material.material_name} 
                secondary={`Quantity: ${material.quantity}`} 
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary" align="center">
          No materials added yet
        </Typography>
      )}

      <MaterialSelectionModal 
        open={showMaterialModal}
        materials={materials}
        onClose={() => setShowMaterialModal(false)}
        onAddMaterial={handleAddMaterial}
      />
    </>
  );
}

// Configuration for Products CRUD page
const productsConfig = {
  entityName: 'Product',
  pageTitle: 'Products',
  defaultSortKey: 'name',
  addButtonIcon: <AddIcon />,
  renderView: 'card', // Explicitly set to card view
  defaultItem: {
    name: '',
    description: '',
    category: 'STANDARD',
    unit_price: 0,
    current_quantity: '',
    max_stock_level: '',
    stock_status: 'IN_STOCK'
  },
  searchFields: [
    'name',
    'description',
    'category'
  ],
  dialogFields: [
    { 
      key: 'name', 
      label: 'Name',
      type: 'text',
      required: true
    },
    { 
      key: 'description', 
      label: 'Description',
      type: 'text',
      multiline: true,
      required: false
    },
    { 
      key: 'category', 
      label: 'Category',
      type: 'select',
      options: [
        { value: 'STANDARD', label: 'Standard Product' },
        { value: 'CUSTOM', label: 'Custom Product' },
        { value: 'PROTOTYPE', label: 'Prototype' }
      ]
    },
    { 
      key: 'unit_price', 
      label: 'Unit Price',
      type: 'number'
    },
    { 
      key: 'current_quantity', 
      label: 'Current Quantity',
      type: 'number',
      required: true
    },
    { 
      key: 'max_stock_level', 
      label: 'Max Stock Level',
      type: 'number',
      required: true
    },
    { 
      key: 'stock_status', 
      label: 'Stock Status',
      type: 'select',
      required: true,
      options: [
        { value: 'IN_STOCK', label: 'In Stock' },
        { value: 'LOW_STOCK', label: 'Low Stock' },
        { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
        { value: 'DISCONTINUED', label: 'Discontinued' }
      ]
    }
  ],
  renderCardView: (items, onEdit, onDelete, handleOpenWorkstationSequence) => (
    <Grid container spacing={3}>
      {items.map((product) => (
        <Grid item xs={12} sm={6} md={4} key={product.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">{product.name}</Typography>
                <Chip 
                  label={product.stock_status_display || product.stock_status} 
                  color={
                    product.stock_status === 'OUT_OF_STOCK' ? 'error' : 
                    product.stock_status === 'LOW_STOCK' ? 'warning' : 
                    'success'
                  }
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                <strong>Description:</strong> {product.description || 'No description'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Quantity:</strong> {product.current_quantity} / {product.max_stock_level}
              </Typography>
              
              {/* Materials Used Section */}
              {product.materials && product.materials.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Required Materials</strong>
                  </Typography>
                  {product.materials.map((material, index) => (
                    <Typography key={index} variant="body2" color="textSecondary">
                      - {material.material_name || material.name} (Qty: {material.quantity})
                    </Typography>
                  ))}
                </Box>
              )}
              
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => handleOpenWorkstationSequence(product)}
                sx={{ mt: 2 }}
              >
                View Workstation Sequence
              </Button>
            </CardContent>
            <CardActions>
              <Tooltip title="Edit Product">
                <IconButton size="small" onClick={() => onEdit(product)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Product">
                <IconButton size="small" color="error" onClick={() => onDelete(product.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  ),
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category' },
    { key: 'unit_price', label: 'Unit Price' },
    { key: 'current_quantity', label: 'Current Quantity' },
    { key: 'max_stock_level', label: 'Max Stock Level' },
    { 
      key: 'stock_status', 
      label: 'Status',
      render: (item) => (
        <Chip 
          label={item.stock_status_display || item.stock_status} 
          color={
            item.stock_status === 'OUT_OF_STOCK' ? 'error' : 
            item.stock_status === 'LOW_STOCK' ? 'warning' : 
            'success'
          }
          size="small"
        />
      )
    }
  ]
};

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showWorkstationSequence, setShowWorkstationSequence] = useState(false);

  const handleOpenWorkstationSequence = (product) => {
    setSelectedProduct(product);
    setShowWorkstationSequence(true);
  };

  const handleCloseWorkstationSequence = () => {
    setSelectedProduct(null);
    setShowWorkstationSequence(false);
  };

  const ProductsListComponent = withCrudList(
    ProductForm, 
    productService, 
    {
      ...productsConfig,
      renderView: 'card',
      renderCardView: (items, onEdit, onDelete) => {
        const handleOpenWorkstationSequence = (product) => {
          setSelectedProduct(product);
          setShowWorkstationSequence(true);
        };

        return (
          <Grid container spacing={3}>
            {items.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{product.name}</Typography>
                      <Chip 
                        label={product.stock_status_display || product.stock_status} 
                        color={
                          product.stock_status === 'OUT_OF_STOCK' ? 'error' : 
                          product.stock_status === 'LOW_STOCK' ? 'warning' : 
                          'success'
                        }
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Description:</strong> {product.description || 'No description'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Quantity:</strong> {product.current_quantity} / {product.max_stock_level}
                    </Typography>
                    
                    {/* Materials Used Section */}
                    {product.materials && product.materials.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          <strong>Required Materials</strong>
                        </Typography>
                        {product.materials.map((material, index) => (
                          <Typography key={index} variant="body2" color="textSecondary">
                            - {material.material_name || material.name} (Qty: {material.quantity})
                          </Typography>
                        ))}
                      </Box>
                    )}
                    
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => handleOpenWorkstationSequence(product)}
                      sx={{ mt: 2 }}
                    >
                      View Workstation Sequence
                    </Button>
                  </CardContent>
                  <CardActions>
                    <Tooltip title="Edit Product">
                      <IconButton size="small" onClick={() => onEdit(product)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Product">
                      <IconButton size="small" color="error" onClick={() => onDelete(product.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        );
      }
    }
  );

  return (
    <>
      <ProductsListComponent />
      <Dialog 
        open={showWorkstationSequence} 
        onClose={handleCloseWorkstationSequence}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <WorkstationSequenceComponent 
            productId={selectedProduct.id} 
            onClose={handleCloseWorkstationSequence} 
            editable={true}
          />
        )}
      </Dialog>
    </>
  );
}
