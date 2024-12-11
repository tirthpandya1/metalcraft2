import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar,
  Divider,
  Box,
  Typography,
  Collapse
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Inventory as InventoryIcon, 
  Factory as ProductionIcon,
  Widgets as ProductIcon,
  Inventory2 as MaterialIcon,
  Computer as WorkstationIcon,
  Settings as ProcessIcon,
  DesignServices as DesignIcon,
  Event as EventIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  Work as WorkOrderIcon,
  Analytics as EfficiencyIcon
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const drawerWidth = 240;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const [openInventory, setOpenInventory] = useState(
    location.pathname === '/products' || location.pathname === '/materials'
  );
  const [openProduction, setOpenProduction] = useState(
    [
      '/workstations', 
      '/production-designs', 
      '/production-events',
      '/production-logs'
    ].includes(location.pathname)
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleInventoryClick = () => {
    setOpenInventory(!openInventory);
  };

  const handleProductionClick = () => {
    setOpenProduction(!openProduction);
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
      text: 'Efficiency Metrics', 
      icon: <EfficiencyIcon />, 
      path: '/workstation-efficiency' 
    },
    { 
      text: 'Inventory', 
      icon: <InventoryIcon />, 
      onClick: handleInventoryClick,
      open: openInventory,
      children: [
        { 
          text: 'Products', 
          icon: <ProductIcon />, 
          path: '/products' 
        },
        { 
          text: 'Materials', 
          icon: <MaterialIcon />, 
          path: '/materials' 
        }
      ]
    },
    { 
      text: 'Production', 
      icon: <ProductionIcon />, 
      onClick: handleProductionClick,
      open: openProduction,
      children: [
        { 
          text: 'Workstations', 
          icon: <WorkstationIcon />, 
          path: '/workstations' 
        },
        { 
          text: 'Production Logs', 
          icon: <EventIcon />, 
          path: '/production-logs' 
        },
        { 
          text: 'Production Designs', 
          icon: <DesignIcon />, 
          path: '/production-designs' 
        },
        { 
          text: 'Production Events', 
          icon: <EventIcon />, 
          path: '/production-events' 
        }
      ]
    }
  ];

  const renderMenuItem = (item) => {
    if (item.children) {
      return (
        <React.Fragment key={item.text}>
          <ListItem 
            button 
            onClick={item.onClick}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.08)'
              }
            }}
          >
            <ListItemIcon sx={{ color: '#c0caf5' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                color: 'text.primary',
                variant: 'body1'
              }} 
            />
            {item.open ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={item.open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => (
                <ListItem 
                  button 
                  key={child.path}  
                  component={Link}
                  to={child.path}
                  sx={{ 
                    pl: 4,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.08)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: '#c0caf5' }}>
                    {child.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={child.text} 
                    primaryTypographyProps={{ 
                      color: 'text.primary',
                      variant: 'body1'
                    }} 
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem 
        key={item.path}  
        button 
        component={Link} 
        to={item.path}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.08)'
          }
        }}
      >
        <ListItemIcon sx={{ color: '#c0caf5' }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.text} 
          primaryTypographyProps={{ 
            color: 'text.primary',
            variant: 'body1'
          }} 
        />
      </ListItem>
    );
  };

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#16161e',
          borderRight: 'none'
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              flexGrow: 1, 
              color: '#7aa2f7', 
              fontWeight: 'bold' 
            }}
          >
            Metalcraft
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => renderMenuItem(item))}
      </List>

      <Divider />

      <List>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.08)'
            }
          }}
        >
          <ListItemIcon sx={{ color: '#f7768e' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ 
              color: 'text.primary',
              variant: 'body1'
            }} 
          />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default Sidebar;
