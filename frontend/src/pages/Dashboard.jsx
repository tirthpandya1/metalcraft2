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
  PieChart, 
  Pie, 
  Cell, 
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
  Assignment as WorkIcon,
  TrendingUp as TrendIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon,
  WorkOutline as WorkOutlineIcon
} from '@mui/icons-material';

import axios from '../services/axiosConfig';
import { formatLocalDateTime, formatRelativeTime } from '../utils/timeUtils';

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
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <WorkIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Work Order Overview</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: dashboardData.work_orders.completed },
                      { name: 'In Progress', value: dashboardData.work_orders.in_progress },
                      { name: 'Pending', value: dashboardData.work_orders.total - (dashboardData.work_orders.completed + dashboardData.work_orders.in_progress) }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {['#0088FE', '#00C49F', '#FFBB28'].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Production Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Production Performance</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.monthly_production}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(tick) => formatLocalDateTime(tick, { month: 'short' })}
                  />
                  <YAxis label={{ value: 'Quantity', angle: -90, position: 'insideLeft' }} />
                  <ChartTooltip 
                    labelFormatter={(label) => formatLocalDateTime(label, { month: 'long', year: 'numeric' })}
                  />
                  <Line type="monotone" dataKey="avg_quantity" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Material Usage */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <BuildIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Material Usage</Typography>
              </Box>
              {dashboardData.material_usage && dashboardData.material_usage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.material_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      label={{ 
                        value: 'Quantity', 
                        angle: -90, 
                        position: 'insideLeft' 
                      }} 
                    />
                    <ChartTooltip 
                      formatter={(value, name, props) => [
                        `${value.toFixed(2)} units`, 
                        `${props.payload.percentage.toFixed(2)}%`
                      ]}
                      contentStyle={{ 
                        backgroundColor: '#f5f5f5', 
                        border: '1px solid #d5d5d5' 
                      }}
                    />
                    <Bar 
                      dataKey="total_consumed" 
                      fill="#8884d8" 
                      fillOpacity={(entry) => Math.max(0.3, entry.percentage / 100)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  height={300}
                >
                  <Typography variant="body2" color="textSecondary">
                    No material usage data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Analytics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <MoneyIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Cost Analysis</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    Total Work Order Cost: ₹{costData.work_order_cost.total_cost?.toFixed(2) || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={costData.cost_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis 
                        label={{ 
                          value: 'Cost (₹)', 
                          angle: -90, 
                          position: 'insideLeft' 
                        }} 
                      />
                      <ChartTooltip 
                        formatter={(value) => [`₹${value.toFixed(2)}`, 'Cost']}
                      />
                      <Bar dataKey="amount" fill="#8884d8" />
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
