import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  MenuItem, 
  Grid,
  Typography
} from '@mui/material';

const MaterialSelectionModal = ({ open, materials = [], onClose, onAddMaterial }) => {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Normalize materials list
  const materialsList = useMemo(() => {
    // If materials is already an array, use it
    if (Array.isArray(materials)) return materials;

    // Check for results or data property
    if (materials.results && Array.isArray(materials.results)) return materials.results;
    if (materials.data && Array.isArray(materials.data)) return materials.data;

    // If no recognizable array structure, return an empty array
    console.warn('Unexpected materials structure:', materials);
    return [];
  }, [materials]);

  // Debug logging
  useEffect(() => {
    console.group('MaterialSelectionModal Debug');
    console.log('Raw Materials:', materials);
    console.log('Processed Materials List:', materialsList);
    console.log('Materials Type:', typeof materials);
    console.log('Is Array:', Array.isArray(materials));
    console.log('Materials Length:', materialsList.length);
    console.groupEnd();
  }, [materials, materialsList]);

  const handleAddMaterial = () => {
    if (selectedMaterial && quantity > 0) {
      onAddMaterial(selectedMaterial, quantity);
      // Reset state
      setSelectedMaterial(null);
      setQuantity(1);
      onClose(); // Close the modal after adding
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Select Material</DialogTitle>
      <DialogContent>
        {materialsList.length === 0 ? (
          <Typography variant="body2" color="error">
            No materials available. Please add materials first.
          </Typography>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={8}>
              <TextField
                select
                fullWidth
                label="Material"
                value={selectedMaterial?.id || ''}
                onChange={(e) => {
                  const material = materialsList.find(m => m.id === e.target.value);
                  console.log('Selected Material:', material);
                  setSelectedMaterial(material);
                }}
                variant="outlined"
              >
                {materialsList.map((material) => (
                  <MenuItem key={material.id} value={material.id}>
                    {material.name} (Current Stock: {material.quantity || 0})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                variant="outlined"
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleAddMaterial} 
          color="primary" 
          variant="contained"
          disabled={!selectedMaterial || quantity <= 0 || materialsList.length === 0}
        >
          Add Material
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialSelectionModal;
