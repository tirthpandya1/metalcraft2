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
        InputProps={{
          readOnly: true
        }}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Performance Category"
        select
        value={item.performance_category || 'STANDARD'}
        InputProps={{
          readOnly: true
        }}
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
        label="Total Working Time (mins)"
        type="number"
        value={item.total_working_time || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          total_working_time: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Total Idle Time (mins)"
        type="number"
        value={item.total_idle_time || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          total_idle_time: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Total Material Used"
        type="number"
        value={item.total_material_used || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          total_material_used: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Total Material Wasted"
        type="number"
        value={item.total_material_wasted || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          total_material_wasted: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Total Items Processed"
        type="number"
        value={item.total_items_processed || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          total_items_processed: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Total Defective Items"
        type="number"
        value={item.total_items_with_defects || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          total_items_with_defects: e.target.value
        }))}
      />
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
    total_working_time: 0,
    total_idle_time: 0,
    total_material_used: 0,
    total_material_wasted: 0,
    total_items_processed: 0,
    total_items_with_defects: 0,
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
      max: 100,
      readOnly: true  // Computed on backend
    },
    { 
      key: 'performance_category', 
      label: 'Performance Category',
      type: 'select',
      readOnly: true,  // Computed on backend
      options: [
        { value: 'STANDARD', label: 'Standard Performance' },
        { value: 'HIGH', label: 'High Performance' },
        { value: 'LOW', label: 'Low Performance' },
        { value: 'CRITICAL', label: 'Critical Performance' }
      ]
    },
    {
      key: 'total_working_time',
      label: 'Total Working Time (mins)',
      type: 'number'
    },
    {
      key: 'total_idle_time', 
      label: 'Total Idle Time (mins)',
      type: 'number'
    },
    {
      key: 'total_material_used',
      label: 'Total Material Used',
      type: 'number'
    },
    {
      key: 'total_material_wasted',
      label: 'Total Material Wasted',
      type: 'number'
    },
    {
      key: 'total_items_processed',
      label: 'Total Items Processed',
      type: 'number'
    },
    {
      key: 'total_items_with_defects',
      label: 'Total Defective Items',
      type: 'number'
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
      label: 'Efficiency %',
      render: (item) => `${item.efficiency_percentage}%`
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
    },
    {
      key: 'total_items_processed',
      label: 'Items Processed'
    },
    {
      key: 'total_items_with_defects',
      label: 'Defective Items'
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
