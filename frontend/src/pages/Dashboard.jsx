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
  Tooltip,
  TextField,
  CardHeader,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip
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
import { formatCurrency } from '../utils/formatters';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [efficiencyData, setEfficiencyData] = useState(null);
  const [costData, setCostData] = useState(null);
  const [profitabilityData, setProfitabilityData] = useState(null);
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

    const fetchProfitabilityData = async () => {
      try {
        const response = await axios.get('/api/analytics/profitability/');
        console.log('Profitability API Response:', response.data);
        setProfitabilityData(response.data);
      } catch (error) {
        console.error('Failed to fetch profitability data', error.response ? error.response.data : error.message);
        
        // More detailed error handling
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', error.message);
        }

        // Set a default empty state to prevent rendering issues
        setProfitabilityData({
          total_products: 0,
          total_sell_cost: 0,
          total_cost: 0,
          total_profit: 0,
          average_profit_margin: 0,
          products: []
        });
      }
    };

    fetchAnalytics();
    fetchProfitabilityData();
  }, []);

  if (loading) return <CircularProgress />;
  if (!dashboardData) return null;

  const getProfitabilityColor = (category) => {
    switch(category) {
      case 'Highly Profitable': return 'success';
      case 'Profitable': return 'primary';
      case 'Low Margin': return 'warning';
      case 'Loss-Making': return 'error';
      default: return 'default';
    }
  };

  const ProfitabilityCard = ({ profitabilityData }) => {
    // Add console log to debug
    console.log('Profitability Data:', profitabilityData);

    if (!profitabilityData) {
      return (
        <Card>
          <CardContent>
            <Typography variant="body1">No profitability data available</Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader 
          title="Profitability Overview" 
          action={
            <Tooltip title={profitabilityData.total_products > 0 ? 'Overall Profitability Status' : 'No Products'}>
              <Chip 
                label={profitabilityData.total_products > 0 
                  ? (profitabilityData.products[0]?.profitability_category || 'N/A') 
                  : 'No Data'
                } 
                color={profitabilityData.total_products > 0 
                  ? (getProfitabilityColor(profitabilityData.products[0]?.profitability_category) || 'default') 
                  : 'default'
                }
                variant="outlined"
              />
            </Tooltip>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle1">Total Products</Typography>
              <Typography variant="h6">{profitabilityData.total_products || 0}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle1">Total Sell Cost</Typography>
              <Typography variant="h6">{formatCurrency(profitabilityData.total_sell_cost || 0)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle1">Total Cost</Typography>
              <Typography variant="h6">{formatCurrency(profitabilityData.total_cost || 0)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle1">Total Profit</Typography>
              <Typography variant="h6" color={profitabilityData.total_profit > 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(profitabilityData.total_profit || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Average Profit Margin</Typography>
              <Typography variant="h6" color={profitabilityData.average_profit_margin > 0 ? 'success.main' : 'error.main'}>
                {(profitabilityData.average_profit_margin || 0).toFixed(2)}%
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Sell Cost</TableCell>
                  <TableCell align="right">Total Cost</TableCell>
                  <TableCell align="right">Profit</TableCell>
                  <TableCell align="right">Profit Margin</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(profitabilityData.products || []).map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell align="right">{formatCurrency(product.sell_cost)}</TableCell>
                    <TableCell align="right">{formatCurrency(product.total_cost)}</TableCell>
                    <TableCell 
                      align="right" 
                      style={{ color: product.profit > 0 ? 'green' : 'red' }}
                    >
                      {formatCurrency(product.profit)}
                    </TableCell>
                    <TableCell 
                      align="right" 
                      style={{ color: product.profit_margin > 0 ? 'green' : 'red' }}
                    >
                      {product.profit_margin.toFixed(2)}%
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={product.profitability_category} 
                        size="small" 
                        color={getProfitabilityColor(product.profitability_category)}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Material Cost Breakdown</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell align="right">Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profitabilityData.products && profitabilityData.products[0]?.material_breakdown?.map((material, index) => (
                    <TableRow key={index}>
                      <TableCell>{material.material__name}</TableCell>
                      <TableCell align="right">{formatCurrency(material.material_total_cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Workstation Cost Breakdown</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Workstation</TableCell>
                    <TableCell align="right">Hourly Rate</TableCell>
                    <TableCell align="right">Est. Time</TableCell>
                    <TableCell align="right">Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profitabilityData.products && profitabilityData.products[0]?.workstation_breakdown?.map((ws, index) => (
                    <TableRow key={index}>
                      <TableCell>{ws.workstation_name}</TableCell>
                      <TableCell align="right">{formatCurrency(ws.hourly_rate)}/hr</TableCell>
                      <TableCell align="right">{ws.estimated_time_hours.toFixed(2)} hrs</TableCell>
                      <TableCell align="right">{formatCurrency(ws.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

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
                    {[
                      { name: 'Completed', color: '#00C49F' },
                      { name: 'In Progress', color: '#FFBB28' },
                      { name: 'Pending', color: '#FF8042' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend />
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

        {/* Profitability Card */}
        <Grid item xs={12}>
          <ProfitabilityCard profitabilityData={profitabilityData} />
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

const ProductForm = ({ product, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sell_cost: product?.sell_cost || 0,
    labor_cost: product?.labor_cost || 0,
    current_quantity: product?.current_quantity || 0,
    restock_level: product?.restock_level || 10,
    max_stock_level: product?.max_stock_level || 100,
  });

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        label="Name"
        type="text"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Description"
        type="text"
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Sell Cost"
        type="number"
        value={formData.sell_cost}
        onChange={(e) => handleInputChange('sell_cost', e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Labor Cost"
        type="number"
        value={formData.labor_cost}
        onChange={(e) => handleInputChange('labor_cost', e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Current Quantity"
        type="number"
        value={formData.current_quantity}
        onChange={(e) => handleInputChange('current_quantity', e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Restock Level"
        type="number"
        value={formData.restock_level}
        onChange={(e) => handleInputChange('restock_level', e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Max Stock Level"
        type="number"
        value={formData.max_stock_level}
        onChange={(e) => handleInputChange('max_stock_level', e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary">
        Submit
      </Button>
    </Box>
  );
};

export default withErrorHandling(Dashboard);
