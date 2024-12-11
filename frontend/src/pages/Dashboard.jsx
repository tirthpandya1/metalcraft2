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
import { handleApiError, withErrorHandling } from '../utils/errorHandler';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [efficiencyData, setEfficiencyData] = useState(null);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch analytics with individual error handling
        const fetchWithErrorHandling = async (url) => {
          try {
            const response = await axios.get(url);
            return response.data;
          } catch (err) {
            // Use centralized error handling with silent mode
            handleApiError(err, { 
              silent: true, 
              customMessage: `Failed to fetch ${url} analytics` 
            });
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
        // This will catch any unhandled errors from the Promise.all
        handleApiError(err, { 
          customMessage: 'Failed to load dashboard analytics' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <CircularProgress />;
  if (!dashboardData) return null;

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
              {dashboardData.daily_production && dashboardData.daily_production.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={dashboardData.daily_production.map(item => ({
                      ...item,
                      day: new Date(item.day).toLocaleDateString('default', { 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Total Quantity', 
                        angle: -90, 
                        position: 'insideLeft' 
                      }} 
                    />
                    <ChartTooltip 
                      labelFormatter={(label) => `Date: ${label}`}
                      formatter={(value) => [`${value.toFixed(2)} units`, 'Total Quantity']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_quantity" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  height={300}
                >
                  <Typography variant="body2" color="textSecondary">
                    No daily production data available
                  </Typography>
                </Box>
              )}
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
                        value: 'Consumption', 
                        angle: -90, 
                        position: 'insideLeft' 
                      }} 
                    />
                    <ChartTooltip 
                      formatter={(value, name, props) => {
                        if (name === 'total_consumed') {
                          return [`${value.toFixed(2)} units`, 'Total Consumed'];
                        }
                        return value;
                      }}
                    />
                    <Bar dataKey="total_consumed" fill="#8884d8" />
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
              {costData ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      Total Work Order Cost: ₹{costData.work_order_cost?.total_cost?.toFixed(2) || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart 
                        data={costData.material_cost_analysis || []}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis 
                          label={{ 
                            value: 'Cost (₹)', 
                            angle: -90, 
                            position: 'insideLeft' 
                          }} 
                        />
                        <ChartTooltip 
                          formatter={(value) => [`₹${value.toFixed(2)}`, 'Total Cost']}
                        />
                        <Bar dataKey="total_cost" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                </Grid>
              ) : (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  height={300}
                >
                  <Typography variant="body2" color="textSecondary">
                    No cost data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default withErrorHandling(Dashboard);
