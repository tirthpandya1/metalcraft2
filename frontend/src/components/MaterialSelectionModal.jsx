import React, { useState, useEffect } from 'react';
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

const MaterialSelectionModal = ({ open, materials, onClose, onAddMaterial }) => {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Ensure materials is an array and log for debugging
  useEffect(() => {
    console.group('MaterialSelectionModal Debug');
    console.log('Raw Materials:', materials);
    console.log('Materials Type:', typeof materials);
    console.log('Is Array:', Array.isArray(materials));
    console.log('Materials Length:', materials?.length);
    console.groupEnd();
  }, [materials]);

  // Ensure materials is an array, extracting results if needed
  const materialsList = Array.isArray(materials) 
    ? materials 
    : (materials?.results || []);

  const handleAddMaterial = () => {
    if (selectedMaterial && quantity > 0) {
      onAddMaterial(selectedMaterial, quantity);
      // Reset state
      setSelectedMaterial(null);
      setQuantity(1);
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
                    {material.name} (Current Stock: {material.quantity})
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
