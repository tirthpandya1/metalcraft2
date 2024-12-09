import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  LinearProgress,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const EfficiencyPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const WorkstationEfficiency = () => {
  const [efficiencyMetrics, setEfficiencyMetrics] = useState(null);

  useEffect(() => {
    const fetchEfficiencyMetrics = async () => {
      try {
        const response = await axios.get('/api/workstation-efficiency/performance-summary/');
        setEfficiencyMetrics(response.data);
      } catch (error) {
        console.error('Error fetching efficiency metrics:', error);
      }
    };

    fetchEfficiencyMetrics();
  }, []);

  const renderEfficiencyBar = (value, label) => (
    <Tooltip title={`${label}: ${value.toFixed(2)}%`} placement="top">
      <Box>
        <Typography variant="subtitle2">{label}</Typography>
        <LinearProgress 
          variant="determinate" 
          value={value} 
          color={value > 50 ? 'success' : value > 25 ? 'warning' : 'error'}
        />
      </Box>
    </Tooltip>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Workstation Efficiency Dashboard
      </Typography>

      {efficiencyMetrics ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <EfficiencyPaper>
              <Typography variant="h6">Idle Time</Typography>
              {renderEfficiencyBar(
                efficiencyMetrics.avg_idle_time * 100, 
                'Average Idle Time Percentage'
              )}
            </EfficiencyPaper>
          </Grid>

          <Grid item xs={12} md={4}>
            <EfficiencyPaper>
              <Typography variant="h6">Material Wastage</Typography>
              {renderEfficiencyBar(
                efficiencyMetrics.avg_material_wastage, 
                'Average Material Wastage'
              )}
            </EfficiencyPaper>
          </Grid>

          <Grid item xs={12} md={4}>
            <EfficiencyPaper>
              <Typography variant="h6">Defect Rate</Typography>
              {renderEfficiencyBar(
                efficiencyMetrics.avg_defect_rate, 
                'Average Defect Rate'
              )}
            </EfficiencyPaper>
          </Grid>
        </Grid>
      ) : (
        <Typography>Loading efficiency metrics...</Typography>
      )}
    </Box>
  );
};

export default WorkstationEfficiency;
