import React from 'react';
import { Build as BuildIcon } from '@mui/icons-material';
import { Chip } from '@mui/material';
import { workStationService } from '../services/api';
import { withCrudList } from '../components/CrudListPage';

function WorkstationForm({ item, onItemChange }) {
  return (
    <>
      {/* Basic form fields for workstation */}
      <input 
        type="text"
        placeholder="Name"
        value={item.name || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          name: e.target.value
        }))}
      />
      <input 
        type="text"
        placeholder="Description"
        value={item.description || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          description: e.target.value
        }))}
      />
      <select
        value={item.status || 'INACTIVE'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          status: e.target.value
        }))}
      >
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="MAINTENANCE">Maintenance</option>
      </select>
    </>
  );
}

// Configuration for Workstations page
const workstationConfig = {
  entityName: 'Workstation',
  pageTitle: 'Workstations',
  addButtonIcon: <BuildIcon />,
  defaultSortKey: 'name',
  defaultItem: {
    name: '',
    description: '',
    status: 'INACTIVE'
  },
  searchFields: ['name', 'description'],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (item) => {
        const colorMap = {
          'ACTIVE': 'success',
          'INACTIVE': 'default',
          'MAINTENANCE': 'warning'
        };
        return (
          <Chip 
            label={item.status} 
            color={colorMap[item.status] || 'default'}
            size="small"
          />
        );
      }
    }
  ]
};

// Create the Workstations page using the HOC
export default withCrudList(
  WorkstationForm, 
  workStationService, 
  workstationConfig
);
