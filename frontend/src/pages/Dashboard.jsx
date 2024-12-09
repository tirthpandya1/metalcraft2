import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart, 
  Bar 
} from 'recharts';
import { 
  WorkOutline as WorkIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendIcon
} from '@mui/icons-material';

import axios from '../services/axiosConfig';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [efficiencyData, setEfficiencyData] = useState(null);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch analytics with individual error handling
        const fetchWithErrorHandling = async (url) => {
          try {
            const response = await axios.get(url);
            return response.data;
          } catch (err) {
            console.error(`Error fetching ${url}:`, err.response ? err.response.data : err);
            throw err;
          }
        };

        const [dashboardData, efficiencyData, costData] = await Promise.all([
          fetchWithErrorHandling('/api/analytics/dashboard'),
          fetchWithErrorHandling('/api/analytics/efficiency'),
          fetchWithErrorHandling('/api/analytics/cost')
        ]);

        setDashboardData(dashboardData);
        setEfficiencyData(efficiencyData);
        setCostData(costData);
      } catch (err) {
        const errorMessage = err.response?.data?.error || 
                             err.response?.data?.detail || 
                             err.response?.data?.message || 
                             'Failed to load dashboard analytics';
        
        setError(errorMessage);
        console.error('Complete Analytics Fetch Error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: errorMessage,
          url: err.config?.url
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manufacturing Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Work Order Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WorkIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Work Order Status</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Tooltip title="Total Work Orders">
                    <Typography variant="body2">
                      Total: {dashboardData.work_orders.total}
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid item xs={4}>
                  <Tooltip title="Completed Work Orders">
                    <Typography variant="body2" color="success.main">
                      Completed: {dashboardData.work_orders.completed}
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid item xs={4}>
                  <Tooltip title="In Progress Work Orders">
                    <Typography variant="body2" color="warning.main">
                      In Progress: {dashboardData.work_orders.in_progress}
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Production Efficiency */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Monthly Production Efficiency</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avg_efficiency" 
                    stroke="#8884d8" 
                    name="Efficiency Rate" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_production" 
                    stroke="#82ca9d" 
                    name="Total Production" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Material Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BuildIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Material Usage</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.material_usage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="total_consumed" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Analytics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MoneyIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Cost Analysis</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    Total Work Order Cost: ${costData.work_order_cost.total_cost?.toFixed(2) || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    Average Work Order Cost: ${costData.work_order_cost.avg_cost?.toFixed(2) || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={costData.material_cost_analysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <Bar dataKey="total_cost" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
