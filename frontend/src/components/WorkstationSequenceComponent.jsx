import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

const formatEstimatedTime = (timeString) => {
  if (!timeString) return null;
  
  try {
    // Parse the time string (assuming it's in HH:MM:SS format)
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    
    // Create an array of non-zero time components
    const components = [];
    if (hours > 0) components.push(`${hours} hr`);
    if (minutes > 0) components.push(`${minutes} min`);
    if (seconds > 0 && components.length === 0) components.push(`${seconds} sec`);
    
    return components.length > 0 ? components.join(' ') : null;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

const WorkstationSequenceComponent = ({ 
  productId, 
  onClose, 
  editable = false, 
  onSequenceUpdate 
}) => {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [workstations, setWorkstations] = useState([]);
  const [editingSequence, setEditingSequence] = useState(null);

  // Fetch workstations for dropdown
  useEffect(() => {
    const fetchWorkstations = async () => {
      try {
        const response = await axios.get('/api/workstations/');
        setWorkstations(response.data);
      } catch (err) {
        console.error('Error fetching workstations:', err);
      }
    };

    fetchWorkstations();
  }, []);

  // Fetch workstation sequences
  useEffect(() => {
    const fetchWorkstationSequence = async () => {
      try {
        console.log(`Fetching workstation sequence for product ID: ${productId}`);
        const response = await axios.get(`/api/products/${productId}/workstation_sequence/`);
        
        console.log('Workstation Sequence Response:', response);
        
        setSequences(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching workstation sequence:', err);
        setError(err);
        setLoading(false);
      }
    };

    if (productId) {
      fetchWorkstationSequence();
    }
  }, [productId]);

  // Save workstation sequences
  const saveWorkstationSequences = async () => {
    try {
      // Transform sequences to match backend expectation
      const formattedSequences = sequences.map(seq => ({
        workstation_id: seq.workstation,
        sequence_order: seq.sequence_order,
        estimated_time: seq.estimated_time || '00:00:00',
        instruction_set: seq.instruction_set || {}
      }));

      const response = await axios.post(
        `/api/products/${productId}/update_workstation_sequence/`, 
        { sequences: formattedSequences }
      );
      
      // Update sequences with server response
      setSequences(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving workstation sequences:', err);
      // Show error to user
      alert(err.response?.data?.error || 'Failed to save sequences');
    }
  };

  // Add new sequence
  const addNewSequence = () => {
    setEditingSequence({
      workstation: '',
      sequence_order: sequences.length + 1,
      estimated_time: '01:00:00',
      instruction_set: {}
    });
  };

  // Edit existing sequence
  const editSequence = (sequence) => {
    setEditingSequence({...sequence});
  };

  // Remove sequence
  const removeSequence = (sequenceToRemove) => {
    setSequences(sequences.filter(seq => seq.id !== sequenceToRemove.id));
  };

  // Render sequence editing form
  const renderSequenceEditForm = () => {
    if (!editingSequence) return null;

    return (
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Workstation</InputLabel>
          <Select
            value={editingSequence.workstation || ''}
            label="Workstation"
            onChange={(e) => setEditingSequence({
              ...editingSequence, 
              workstation: e.target.value
            })}
          >
            {workstations.map((ws) => (
              <MenuItem key={ws.id} value={ws.id}>
                {ws.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Sequence Order"
          type="number"
          value={editingSequence.sequence_order || (sequences.length + 1)}
          onChange={(e) => setEditingSequence({
            ...editingSequence, 
            sequence_order: parseInt(e.target.value, 10)
          })}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Estimated Time (HH:MM:SS)"
          value={editingSequence.estimated_time || '01:00:00'}
          onChange={(e) => setEditingSequence({
            ...editingSequence, 
            estimated_time: e.target.value
          })}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              // Validate required fields
              if (!editingSequence.workstation) {
                alert('Please select a workstation');
                return;
              }

              // If it's a new sequence, add to sequences
              if (!editingSequence.id) {
                setSequences([...sequences, {
                  workstation: editingSequence.workstation,
                  sequence_order: editingSequence.sequence_order || sequences.length + 1,
                  estimated_time: editingSequence.estimated_time || '01:00:00',
                  instruction_set: editingSequence.instruction_set || {}
                }]);
              } else {
                // Replace existing sequence
                setSequences(sequences.map(seq => 
                  seq.id === editingSequence.id ? editingSequence : seq
                ));
              }
              setEditingSequence(null);
            }}
          >
            Save Sequence
          </Button>
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={() => setEditingSequence(null)}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    );
  };

  // Render sequences in edit mode
  const renderEditableSequences = () => {
    return (
      <Stepper orientation="vertical">
        {sequences.map((sequence) => (
          <Step key={sequence.id} active={true} completed={false}>
            <StepLabel>
              {sequence.workstation_name || 'Unnamed Workstation'}
              <Box sx={{ ml: 2, display: 'inline-flex', alignItems: 'center' }}>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={() => editSequence(sequence)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => removeSequence(sequence)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </StepLabel>
            <StepContent>
              <Paper elevation={3} sx={{ p: 2, maxWidth: 300, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Step {sequence.sequence_order}
                </Typography>
                {sequence.estimated_time && (
                  <Typography variant="body2">
                    Estimated Time: {formatEstimatedTime(sequence.estimated_time)}
                  </Typography>
                )}
              </Paper>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    );
  };

  // Render read-only sequences
  const renderSequenceStepper = () => {
    if (loading) return <Typography>Loading sequence...</Typography>;
    if (error) return <Typography color="error">Error loading sequence</Typography>;
    if (!sequences.length) return <Typography>No workstation sequence defined</Typography>;

    return (
      <Stepper orientation="vertical">
        {sequences.map((sequence) => (
          <Step key={sequence.id} active={true} completed={false}>
            <StepLabel>
              {sequence.workstation_name}
            </StepLabel>
            <StepContent>
              <Paper elevation={3} sx={{ p: 2, maxWidth: 300, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Step {sequence.sequence_order}
                </Typography>
                {sequence.estimated_time && (
                  <Typography variant="body2">
                    Estimated Time: {formatEstimatedTime(sequence.estimated_time)}
                  </Typography>
                )}
                {sequence.instruction_set && (
                  <Box mt={1}>
                    <Typography variant="caption" color="textSecondary">
                      Instructions:
                    </Typography>
                    {Object.entries(sequence.instruction_set).map(([key, value]) => (
                      <Typography key={key} variant="body2">
                        {key}: {value}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Paper>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    );
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        Workstation Sequence
        {(editable || sequences.length > 0) && (
          <IconButton 
            onClick={() => setIsEditing(!isEditing)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            {isEditing ? <CancelIcon /> : <EditIcon />}
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">Error loading sequences</Typography>
        ) : (
          <>
            {isEditing ? (
              <Box>
                {/* Show existing sequences in edit mode */}
                {sequences.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="h6" gutterBottom>
                      Current Sequences
                    </Typography>
                    <Stepper orientation="vertical">
                      {sequences.map((sequence, index) => (
                        <Step key={sequence.id || index} active={true}>
                          <StepLabel
                            optional={
                              <Typography variant="caption">
                                {formatEstimatedTime(sequence.estimated_time)}
                              </Typography>
                            }
                          >
                            {workstations.find(w => w.id === sequence.workstation)?.name || `Workstation ${sequence.workstation}`}
                            <Box sx={{ ml: 2, display: 'inline-flex', alignItems: 'center' }}>
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => {
                                  setEditingSequence({...sequence});
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => {
                                  // Remove only the specific sequence
                                  setSequences(sequences.filter(seq => 
                                    seq.id !== sequence.id || 
                                    seq.workstation !== sequence.workstation || 
                                    seq.sequence_order !== sequence.sequence_order
                                  ));
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </Box>
                )}

                {/* Sequence Edit Form */}
                {renderSequenceEditForm()}

                {/* Add New Sequence Button */}
                <Button 
                  startIcon={<AddIcon />}
                  variant="outlined" 
                  color="primary"
                  onClick={() => {
                    setEditingSequence({
                      workstation: '',
                      sequence_order: sequences.length + 1,
                      estimated_time: '01:00:00',
                      instruction_set: {}
                    });
                  }}
                  sx={{ mt: 2 }}
                >
                  Add Another Sequence
                </Button>

                {/* Save and Cancel Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    startIcon={<SaveIcon />}
                    color="primary"
                    variant="contained"
                    onClick={saveWorkstationSequences}
                    sx={{ mr: 1 }}
                    disabled={sequences.length === 0}
                  >
                    Save Changes
                  </Button>
                  <Button 
                    startIcon={<CancelIcon />}
                    color="secondary"
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingSequence(null);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : sequences.length === 0 ? (
              <Box textAlign="center" p={2}>
                <Typography variant="body1">No workstation sequence defined</Typography>
                {editable && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setIsEditing(true);
                      setEditingSequence({
                        workstation: '',
                        sequence_order: 1,
                        estimated_time: '01:00:00',
                        instruction_set: {}
                      });
                    }}
                    sx={{ mt: 2 }}
                  >
                    Add First Sequence
                  </Button>
                )}
              </Box>
            ) : (
              <Stepper orientation="vertical">
                {sequences.map((sequence, index) => (
                  <Step key={sequence.id || index} active={true}>
                    <StepLabel
                      optional={
                        <Typography variant="caption">
                          {formatEstimatedTime(sequence.estimated_time)}
                        </Typography>
                      }
                    >
                      {workstations.find(w => w.id === sequence.workstation)?.name || `Workstation ${sequence.workstation}`}
                    </StepLabel>
                    <StepContent>
                      {sequence.instruction_set && Object.keys(sequence.instruction_set).length > 0 && (
                        <Typography variant="body2">
                          Instructions: {JSON.stringify(sequence.instruction_set)}
                        </Typography>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WorkstationSequenceComponent;
