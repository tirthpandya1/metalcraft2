import React from 'react';
import { Chip, MenuItem, TextField } from '@mui/material';
import { workstationEfficiencyService, workstationService } from '../services/api';
import { withCrudList } from '../components/CrudListPage';
import { handleApiError, withErrorHandling } from '../utils/errorHandler';

// Workstation Efficiency Form Component
function WorkstationEfficiencyForm({ item, onItemChange, workstations }) {
  return (
    <>
      <TextField
        fullWidth
        margin="normal"
        label="Workstation"
        select
        value={item.workstation?.id || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          workstation: workstations.find(ws => ws.id === e.target.value)
        }))}
        required
      >
        {workstations.map((workstation) => (
          <MenuItem key={workstation.id} value={workstation.id}>
            {workstation.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        margin="normal"
        label="Efficiency Percentage"
        type="number"
        value={item.efficiency_percentage || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          efficiency_percentage: e.target.value
        }))}
        InputProps={{
          inputProps: { 
            min: 0, 
            max: 100 
          }
        }}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Performance Category"
        select
        value={item.performance_category || 'STANDARD'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          performance_category: e.target.value
        }))}
      >
        {[
          { value: 'STANDARD', label: 'Standard Performance' },
          { value: 'HIGH', label: 'High Performance' },
          { value: 'LOW', label: 'Low Performance' },
          { value: 'CRITICAL', label: 'Critical Performance' }
        ].map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        margin="normal"
        label="Notes"
        multiline
        rows={3}
        value={item.notes || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          notes: e.target.value
        }))}
      />
    </>
  );
}

// Configuration for Workstation Efficiency CRUD page
const workstationEfficiencyConfig = {
  entityName: 'Workstation Efficiency',
  pageTitle: 'Workstation Efficiency',
  defaultSortKey: 'created_at',
  defaultItem: {
    workstation: null,
    efficiency_percentage: 0,
    performance_category: 'STANDARD',
    notes: ''
  },
  searchFields: [
    'workstation_name',
    'performance_category',
    'notes'
  ],
  dialogFields: [
    { 
      key: 'workstation', 
      label: 'Workstation',
      type: 'select',
      options: [] // This will be populated dynamically
    },
    { 
      key: 'efficiency_percentage', 
      label: 'Efficiency Percentage',
      type: 'number',
      min: 0,
      max: 100
    },
    { 
      key: 'performance_category', 
      label: 'Performance Category',
      type: 'select',
      options: [
        { value: 'STANDARD', label: 'Standard Performance' },
        { value: 'HIGH', label: 'High Performance' },
        { value: 'LOW', label: 'Low Performance' },
        { value: 'CRITICAL', label: 'Critical Performance' }
      ]
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'text',
      multiline: true
    }
  ],
  columns: [
    { 
      key: 'workstation_name', 
      label: 'Workstation' 
    },
    { 
      key: 'efficiency_percentage', 
      label: 'Efficiency %' 
    },
    { 
      key: 'performance_category', 
      label: 'Performance',
      render: (item) => (
        <Chip 
          label={item.performance_category} 
          color={
            item.performance_category === 'HIGH' ? 'success' : 
            item.performance_category === 'CRITICAL' ? 'error' : 
            item.performance_category === 'LOW' ? 'warning' : 
            'default'
          }
          size="small"
        />
      )
    }
  ]
};

// Export Workstation Efficiency page with CrudListPage HOC and Error Handling
export default withErrorHandling(
  withCrudList(
    WorkstationEfficiencyForm, 
    workstationEfficiencyService, 
    workstationEfficiencyConfig
  )
);
