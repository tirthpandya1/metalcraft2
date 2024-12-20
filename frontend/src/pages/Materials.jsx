import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Grid, 
  Chip, 
  IconButton, 
  Tooltip,
  TextField,
  MenuItem
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Build as BuildIcon 
} from '@mui/icons-material';
import { withCrudList } from '../components/CrudListPage';
import { materialService } from '../services/api';
import { handleApiError, withErrorHandling } from '../utils/errorHandler';

// Configuration for Materials page
const materialsConfig = {
  entityName: 'Material',
  pageTitle: 'Materials',
  defaultSortKey: 'name',
  addButtonIcon: <BuildIcon />,
  searchFields: ['name', 'unit'],
  dialogFields: [
    { 
      key: 'name', 
      label: 'Name',
      type: 'text',
      required: true
    },
    { 
      key: 'unit', 
      label: 'Unit',
      type: 'select',
      required: true,
      options: [
        { value: 'kg', label: 'Kilograms (kg)' },
        { value: 'g', label: 'Grams (g)' },
        { value: 'lb', label: 'Pounds (lb)' },
        { value: 'oz', label: 'Ounces (oz)' },
        { value: 'm', label: 'Meters (m)' },
        { value: 'cm', label: 'Centimeters (cm)' },
        { value: 'mm', label: 'Millimeters (mm)' },
        { value: 'pcs', label: 'Pieces (pcs)' }
      ]
    },
    { 
      key: 'quantity', 
      label: 'Quantity',
      type: 'number',
      required: true,
      step: '0.01'
    },
    { 
      key: 'reorder_level', 
      label: 'Reorder Level',
      type: 'number',
      required: true,
      step: '0.01'
    },
    { 
      key: 'cost_per_unit', 
      label: 'Cost per Unit',
      type: 'number',
      required: false,
      step: '0.01'
    },
    { 
      key: 'description', 
      label: 'Description',
      type: 'text',
      required: false
    }
  ],
  renderCardView: (items, onEdit, onDelete) => (
    <Grid container spacing={3}>
      {items.map((material) => (
        <Grid item xs={12} sm={6} md={4} key={material.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">{material.name}</Typography>
                <Chip 
                  label={material.status || 'In Stock'} 
                  color={
                    material.status === 'Out of Stock' ? 'error' : 
                    material.status === 'Low Stock' ? 'warning' : 
                    'success'
                  }
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                <strong>Quantity:</strong> {material.quantity} {material.unit}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Reorder Level:</strong> {material.reorder_level} {material.unit}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Cost per Unit:</strong> ₹{material.cost_per_unit || 'N/A'}
              </Typography>
              {material.description && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {material.description}
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Tooltip title="Edit Material">
                <IconButton size="small" onClick={() => onEdit(material)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Material">
                <IconButton size="small" color="error" onClick={() => onDelete(material.id)}>
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
    { key: 'unit', label: 'Unit' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'reorder_level', label: 'Reorder Level' },
    { key: 'cost_per_unit', label: 'Cost per Unit' },
    { 
      key: 'status', 
      label: 'Status',
      render: (item) => (
        <Chip 
          label={item.status} 
          color={
            item.status === 'Out of Stock' ? 'error' : 
            item.status === 'Low Stock' ? 'warning' : 
            'success'
          }
          size="small"
        />
      )
    }
  ],
  defaultItem: {
    name: '',
    unit: '',
    quantity: '',
    reorder_level: '',
    cost_per_unit: '',
    description: ''
  }
};

// Custom form component for Materials
const MaterialForm = ({ item, onItemChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onItemChange({ ...item, [name]: value });
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        name="name"
        label="Name"
        value={item.name}
        onChange={handleChange}
        required
        fullWidth
      />
      <TextField
        name="unit"
        label="Unit"
        select
        value={item.unit}
        onChange={handleChange}
        required
        fullWidth
      >
        {materialsConfig.dialogFields.find(f => f.key === 'unit').options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        name="quantity"
        label="Quantity"
        type="number"
        value={item.quantity}
        onChange={handleChange}
        required
        fullWidth
        inputProps={{ step: '0.01' }}
      />
      <TextField
        name="reorder_level"
        label="Reorder Level"
        type="number"
        value={item.reorder_level}
        onChange={handleChange}
        required
        fullWidth
        inputProps={{ step: '0.01' }}
      />
      <TextField
        name="cost_per_unit"
        label="Cost per Unit"
        type="number"
        value={item.cost_per_unit}
        onChange={handleChange}
        fullWidth
        inputProps={{ step: '0.01' }}
      />
      <TextField
        name="description"
        label="Description"
        value={item.description}
        onChange={handleChange}
        fullWidth
        multiline
        rows={3}
      />
    </Box>
  );
};

export default withErrorHandling(
  withCrudList(MaterialForm, materialService, {
    ...materialsConfig,
    renderView: 'card'
  })
);
