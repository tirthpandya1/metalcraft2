import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import axios from 'axios';

const ProductionDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const response = await axios.get('/api/production-designs/');
        setDesigns(response.data);
      } catch (error) {
        console.error('Error fetching production designs:', error);
      }
    };

    fetchDesigns();
  }, []);

  const handleViewDetails = (design) => {
    setSelectedDesign(design);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDesign(null);
  };

  const handleUploadDiagram = async (designId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.png,.jpg,.jpeg';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('diagram', file);

      try {
        await axios.post(`/api/production-designs/${designId}/upload-diagram/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        alert('Diagram uploaded successfully!');
      } catch (error) {
        console.error('Error uploading diagram:', error);
        alert('Failed to upload diagram');
      }
    };

    fileInput.click();
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Production Designs
      </Typography>

      <Grid container spacing={3}>
        {designs.map((design) => (
          <Grid item xs={12} sm={6} md={4} key={design.id}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={design.design_file || '/default-design.png'}
                alt={`Design for ${design.product_name}`}
              />
              <CardContent>
                <Typography variant="h6">{design.product_name}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => handleViewDetails(design)}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={() => handleUploadDiagram(design.id)}
                  >
                    Upload Diagram
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Design Details</DialogTitle>
        <DialogContent>
          {selectedDesign && (
            <Box>
              <Typography variant="subtitle1">Product: {selectedDesign.product_name}</Typography>
              <Typography variant="subtitle1">Instruction Set:</Typography>
              <pre>{JSON.stringify(selectedDesign.instruction_set, null, 2)}</pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductionDesigns;
