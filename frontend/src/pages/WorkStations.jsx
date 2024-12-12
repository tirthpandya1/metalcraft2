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
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { 
  Build as BuildIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { formatRelativeTime } from '../utils/timeUtils';
import { handleApiError, withErrorHandling } from '../utils/errorHandler';

const WorkstationCard = ({ workstation, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE': return 'success';
      case 'MAINTENANCE': return 'warning';
      case 'INACTIVE': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'ACTIVE': return <CheckCircleIcon color="success" />;
      case 'MAINTENANCE': return <WarningIcon color="warning" />;
      case 'INACTIVE': return <SettingsIcon color="error" />;
      default: return null;
    }
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s',
        '&:hover': { transform: 'scale(1.02)' }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {workstation.name}
          </Typography>
          {getStatusIcon(workstation.status)}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {workstation.description}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Chip 
            label={workstation.status} 
            color={getStatusColor(workstation.status)} 
            size="small" 
            sx={{ mr: 1 }}
          />
          <Chip 
            label={workstation.process_type || 'MANUAL'} 
            variant="outlined"
            color={workstation.process_type === 'AUTOMATIC' ? 'primary' : 'secondary'}
            size="small" 
          />
          <Chip 
            label={`₹${workstation.hourly_operating_cost || 0}/hr`} 
            variant="outlined"
            color="info"
            size="small" 
            sx={{ ml: 1 }}
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption">
            Last Maintenance: {formatRelativeTime(workstation.last_maintenance_display) || 'N/A'}
          </Typography>
        </Box>
      </CardContent>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Tooltip title="Edit Workstation">
          <IconButton onClick={() => onEdit(workstation)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Workstation">
          <IconButton color="error" onClick={() => onDelete(workstation.id)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

const WorkstationForm = ({ item, onItemChange }) => {
  // If item is null, provide a default object
  const safeItem = item || { 
    name: '', 
    description: '', 
    process_type: 'MANUAL', 
    status: 'INACTIVE',
    hourly_operating_cost: 0
  };

  return (
    <>
      <TextField
        fullWidth
        margin="normal"
        label="Name"
        value={safeItem.name || ''}
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
        value={safeItem.description || ''}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          description: e.target.value
        }))}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Process Type"
        select
        value={safeItem.process_type || 'MANUAL'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          process_type: e.target.value
        }))}
      >
        <MenuItem value="MANUAL">Manual</MenuItem>
        <MenuItem value="AUTOMATIC">Automatic</MenuItem>
      </TextField>
      <TextField
        fullWidth
        margin="normal"
        label="Status"
        select
        value={safeItem.status || 'INACTIVE'}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          status: e.target.value
        }))}
      >
        <MenuItem value="ACTIVE">Active</MenuItem>
        <MenuItem value="INACTIVE">Inactive</MenuItem>
        <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
      </TextField>
      <TextField
        fullWidth
        margin="normal"
        label="Hourly Operating Cost"
        type="number"
        value={safeItem.hourly_operating_cost || 0}
        onChange={(e) => onItemChange(prev => ({
          ...prev,
          hourly_operating_cost: parseFloat(e.target.value) || 0
        }))}
        InputProps={{
          startAdornment: <InputAdornment position="start">₹</InputAdornment>
        }}
      />
    </>
  );
};

const workstationConfig = {
  entityName: 'Workstation',
  pageTitle: 'Workstations',
  defaultSortKey: 'name',
  defaultItem: {
    name: '',
    description: '',
    process_type: 'MANUAL',
    status: 'INACTIVE',
    hourly_operating_cost: 0
  },
  searchFields: [
    'name',
    'description',
    'process_type',
    'status'
  ],
  dialogFields: [
    { 
      key: 'name', 
      label: 'Name',
      type: 'text'
    },
    { 
      key: 'description', 
      label: 'Description',
      type: 'text',
      multiline: true
    },
    { 
      key: 'process_type', 
      label: 'Process Type',
      type: 'select',
      options: [
        { value: 'MANUAL', label: 'Manual' },
        { value: 'AUTOMATIC', label: 'Automatic' }
      ]
    },
    { 
      key: 'status', 
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'MAINTENANCE', label: 'Maintenance' }
      ]
    },
    { 
      key: 'hourly_operating_cost', 
      label: 'Hourly Operating Cost',
      type: 'number'
    }
  ],
  columns: [
    { 
      key: 'name', 
      label: 'Name' 
    },
    { 
      key: 'process_type', 
      label: 'Process Type',
      render: (item) => (
        <Chip 
          label={item.process_type} 
          color={item.process_type === 'AUTOMATIC' ? 'primary' : 'secondary'}
          size="small"
        />
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (item) => (
        <Chip 
          label={item.status} 
          color={
            item.status === 'ACTIVE' ? 'success' : 
            item.status === 'MAINTENANCE' ? 'warning' : 
            'error'
          }
          size="small"
        />
      )
    }
  ]
};

const WorkStations = () => {
  const [workstations, setWorkstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkstation, setSelectedWorkstation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchWorkstations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/workstations/');
      
      // Ensure workstations is always an array
      const workstationData = Array.isArray(response.data) ? response.data : 
                               (response.data.results ? response.data.results : []);
      
      // No need to fetch additional maintenance logs, as it's now part of the WorkStation model
      setWorkstations(workstationData);
      setError(null);
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workstation) => {
    setSelectedWorkstation(workstation);
    setIsDialogOpen(true);
  };

  const handleDelete = async (workstationId) => {
    try {
      await axios.delete(`/api/workstations/${workstationId}/`);
      fetchWorkstations();
    } catch (err) {
      handleApiError(err, setError);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedWorkstation(null);
  };

  const handleSave = async () => {
    try {
      if (selectedWorkstation.id) {
        await axios.put(`/api/workstations/${selectedWorkstation.id}/`, selectedWorkstation);
      } else {
        await axios.post('/api/workstations/', selectedWorkstation);
      }
      fetchWorkstations();
      handleDialogClose();
    } catch (err) {
      handleApiError(err, setError);
    }
  };

  useEffect(() => {
    fetchWorkstations();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Workstations</Typography>
        <Button 
          variant="contained" 
          startIcon={<BuildIcon />}
          onClick={() => {
            setSelectedWorkstation({ name: '', description: '', process_type: 'MANUAL', status: 'INACTIVE', hourly_operating_cost: 0 });
            setIsDialogOpen(true);
          }}
        >
          Add Workstation
        </Button>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {workstations.map((workstation) => (
            <Grid item xs={12} sm={6} md={4} key={workstation.id}>
              <WorkstationCard workstation={workstation} onEdit={handleEdit} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={isDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedWorkstation?.id ? 'Edit Workstation' : 'Add Workstation'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <WorkstationForm item={selectedWorkstation} onItemChange={setSelectedWorkstation} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default withErrorHandling(WorkStations);
