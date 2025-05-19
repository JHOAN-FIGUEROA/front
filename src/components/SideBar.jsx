import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Collapse, IconButton, Box, Divider, Button } from '@mui/material';
import { Dashboard, Settings, People, Security, ExpandLess, ExpandMore, Menu, Logout } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    background: '#4169E1',
    borderRight: '1px solid #e0e0e0',
    color: '#fff',
  },
}));

const SideBar = ({ open, onToggle }) => {
  const [openConfig, setOpenConfig] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleConfigClick = () => {
    setOpenConfig(!openConfig);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (onToggle) onToggle(false);
  };

  return (
    <StyledDrawer variant="permanent" open={open}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: open ? 'flex-end' : 'center' }}>
        <IconButton onClick={() => onToggle(!open)}>
          <Menu />
        </IconButton>
      </Box>
      <Divider />
      <List>
        <ListItem button selected={location.pathname === '/dashboard'} onClick={() => handleNavigate('/dashboard')}>
          <ListItemIcon sx={{ color: '#fff' }}>
            <Dashboard />
          </ListItemIcon>
          {open && <ListItemText primary="DashBoard" />}
        </ListItem>
        <ListItem button onClick={handleConfigClick}>
          <ListItemIcon sx={{ color: '#fff' }}>
            <Settings />
          </ListItemIcon>
          {open && <ListItemText primary="Configuración" />}
          {open ? (openConfig ? <ExpandLess /> : <ExpandMore />) : null}
        </ListItem>
        <Collapse in={openConfig && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem button sx={{ pl: 4 }} selected={location.pathname === '/config/usuarios'} onClick={() => handleNavigate('/config/usuarios')}>
              <ListItemIcon sx={{ color: '#fff', pl: 1 }}>
                <People />
              </ListItemIcon>
              <ListItemText primary="Usuarios" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} selected={location.pathname === '/config/roles'} onClick={() => handleNavigate('/config/roles')}>
              <ListItemIcon sx={{ color: '#fff', pl: 1 }}>
                <Security />
              </ListItemIcon>
              <ListItemText primary="Roles" />
            </ListItem>
          </List>
        </Collapse>
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Logout />}
          sx={{ backgroundColor: '#dc3545', color: 'white', '&:hover': { backgroundColor: '#c82333' } }}
          onClick={logout}
        >
          {open && 'Cerrar Sesión'}
        </Button>
      </Box>
    </StyledDrawer>
  );
};

export default SideBar; 