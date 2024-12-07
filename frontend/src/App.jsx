import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import WorkStations from './pages/WorkStations';
import Materials from './pages/Materials';
import Products from './pages/Products';
import WorkOrders from './pages/WorkOrders';

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workstations" element={<WorkStations />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/products" element={<Products />} />
          <Route path="/workorders" element={<WorkOrders />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
