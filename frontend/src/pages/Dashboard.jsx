import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data - replace with actual API calls
const workStationData = [
  { name: 'Active', value: 8 },
  { name: 'Idle', value: 3 },
  { name: 'Maintenance', value: 2 },
];

const workOrderData = [
  { name: 'Pending', value: 15 },
  { name: 'In Progress', value: 10 },
  { name: 'Completed', value: 25 },
  { name: 'Delayed', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function Dashboard() {
  const [stations, setStations] = useState(workStationData);
  const [orders, setOrders] = useState(workOrderData);

  // Simulating real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real application, you would fetch updated data from your API here
      setStations(prev => prev.map(item => ({
        ...item,
        value: item.value + Math.floor(Math.random() * 3) - 1
      })));

      setOrders(prev => prev.map(item => ({
        ...item,
        value: item.value + Math.floor(Math.random() * 5) - 2
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Work Stations Status
            </Typography>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stations}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Work Orders Status
            </Typography>
            <ResponsiveContainer>
              <BarChart
                data={orders}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8">
                  {orders.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
