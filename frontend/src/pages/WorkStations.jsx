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
  TableBody
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
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption">
            Last Maintenance: {workstation.last_maintenance ? formatRelativeTime(workstation.last_maintenance) : 'N/A'}
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

export default function WorkStations() {
  const [workstations, setWorkstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkstation, setSelectedWorkstation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchWorkstations();
  }, []);

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
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.error || 
                           'Failed to fetch workstations';
      
      console.error('Workstations Fetch Error:', errorMessage);
      setError(errorMessage);
      setWorkstations([]);
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
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.error || 
                           'Failed to delete workstation';
      setError(errorMessage);
      console.error('Workstation delete error:', err);
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
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.error || 
                           'Failed to save workstation';
      setError(errorMessage);
      console.error('Workstation save error:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Workstations</Typography>
        <Button 
          variant="contained" 
          startIcon={<BuildIcon />}
          onClick={() => {
            setSelectedWorkstation({ name: '', description: '', status: 'INACTIVE', process_type: 'MANUAL' });
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
            <TextField
              label="Name"
              value={selectedWorkstation?.name || ''}
              onChange={(e) => setSelectedWorkstation(prev => ({
                ...prev,
                name: e.target.value
              }))}
              fullWidth
            />
            <TextField
              label="Description"
              value={selectedWorkstation?.description || ''}
              onChange={(e) => setSelectedWorkstation(prev => ({
                ...prev,
                description: e.target.value
              }))}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Status"
              value={selectedWorkstation?.status || 'INACTIVE'}
              onChange={(e) => setSelectedWorkstation(prev => ({
                ...prev,
                status: e.target.value
              }))}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </TextField>
            <TextField
              select
              label="Process Type"
              value={selectedWorkstation?.process_type || 'MANUAL'}
              onChange={(e) => setSelectedWorkstation(prev => ({
                ...prev,
                process_type: e.target.value
              }))}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATIC">Automatic</option>
            </TextField>
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
}
