import React from 'react';
import { 
  TableCell, 
  TableRow, 
  Chip,
  IconButton
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { withCrudList } from '../components/CrudListPage';
import { materialService } from '../services/api';

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

// Create the Materials page using the HOC
export default withCrudList(null, materialService, materialsConfig);
