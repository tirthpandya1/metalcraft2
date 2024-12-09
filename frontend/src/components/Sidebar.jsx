import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar,
  Divider,
  Box,
  Typography
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Work as WorkOrderIcon, 
  Inventory as MaterialIcon, 
  Widgets as ProductIcon,
  Logout as LogoutIcon,
  Computer as WorkstationIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const drawerWidth = 240;

function Sidebar() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard' 
    },
    { 
      text: 'Work Orders', 
      icon: <WorkOrderIcon />, 
      path: '/work-orders' 
    },
    { 
      text: 'Materials', 
      icon: <MaterialIcon />, 
      path: '/materials' 
    },
    { 
      text: 'Products', 
      icon: <ProductIcon />, 
      path: '/products' 
    },
    { 
      text: 'Workstations', 
      icon: <WorkstationIcon />, 
      path: '/workstations' 
    }
  ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar>
        <Typography variant="h6" noWrap>
          Metalcraft
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="subtitle1">
            Welcome, {user.username || 'User'}
          </Typography>
        </Box>
      )}
      
      <Divider />
      
      {/* Menu Items */}
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            component={Link} 
            to={item.path}
            button
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {/* Logout */}
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default Sidebar;
