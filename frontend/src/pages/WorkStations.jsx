import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

// Mock data - replace with actual API data
const mockWorkStations = [
  {
    id: 1,
    name: 'CNC Machine 1',
    status: 'Active',
    currentJob: 'Metal Cutting - Order #123',
    efficiency: '95%',
    lastMaintenance: '2024-11-30',
  },
  {
    id: 2,
    name: 'Welding Station 1',
    status: 'Idle',
    currentJob: '-',
    efficiency: '88%',
    lastMaintenance: '2024-12-01',
  },
  {
    id: 3,
    name: 'Assembly Line A',
    status: 'Maintenance',
    currentJob: 'Scheduled Maintenance',
    efficiency: '92%',
    lastMaintenance: '2024-12-07',
  },
];

function WorkStations() {
  const [workStations, setWorkStations] = useState(mockWorkStations);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'idle':
        return 'warning';
      case 'maintenance':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Work Stations</Typography>
        <Button
          variant="contained"
          startIcon={<BuildIcon />}
          onClick={() => {/* Add new work station logic */}}
        >
          Add Work Station
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Current Job</TableCell>
              <TableCell>Efficiency</TableCell>
              <TableCell>Last Maintenance</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workStations.map((station) => (
              <TableRow key={station.id}>
                <TableCell>{station.name}</TableCell>
                <TableCell>
                  <Chip
                    label={station.status}
                    color={getStatusColor(station.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{station.currentJob}</TableCell>
                <TableCell>{station.efficiency}</TableCell>
                <TableCell>{station.lastMaintenance}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => {/* Edit station logic */}}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {/* Refresh station status logic */}}
                  >
                    <RefreshIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default WorkStations;
