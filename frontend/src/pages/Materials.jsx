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

// Row component for Materials
function MaterialRow({ item, onEdit, onDelete }) {
  return (
    <TableRow>
      <TableCell>{item.name}</TableCell>
      <TableCell>{item.unit}</TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell>{item.reorder_level}</TableCell>
      <TableCell>{item.cost_per_unit || 'N/A'}</TableCell>
      <TableCell>
        <IconButton size="small" onClick={onEdit}>
          <EditIcon />
        </IconButton>
        <IconButton size="small" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

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
export default withCrudList(MaterialRow, materialService, materialsConfig);
