import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Collapse, IconButton, Box, Divider, Button } from '@mui/material';
import { Dashboard, Settings, People, Security, ExpandLess, ExpandMore, Menu, Logout } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;
const closedDrawerWidth = 64; // Ancho cuando el sidebar está cerrado

const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
  width: open ? drawerWidth : closedDrawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap', // Evita que el contenido se envuelva
  boxSizing: 'border-box',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden', // Oculta el contenido que excede el ancho
  '& .MuiDrawer-paper': {
    width: open ? drawerWidth : closedDrawerWidth,
    boxSizing: 'border-box',
    background: '#4169E1',
    color: '#fff',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden', // Oculta el contenido que excede el ancho
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
    // Removed the automatic closing on navigate as per your previous request.
    // If you still want it to close on navigate, let me know.
    // if (onToggle) onToggle(false);
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
        <ListItem {...({ button: 'true' })} selected={location.pathname === '/dashboard'} onClick={() => handleNavigate('/dashboard')}>
          <ListItemIcon sx={{ color: '#fff' }}>
            <Dashboard />
          </ListItemIcon>
          {open && <ListItemText primary="DashBoard" />}
        </ListItem>
        <ListItem {...({ button: 'true' })} onClick={handleConfigClick}>
          <ListItemIcon sx={{ color: '#fff' }}>
            <Settings />
          </ListItemIcon>
          {open && <ListItemText primary="Configuración" />}
          {open ? (openConfig ? <ExpandLess /> : <ExpandMore />) : null}
        </ListItem>
        <Collapse in={openConfig && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem {...({ button: 'true' })} sx={{ pl: openConfig && open ? 4 : 0 }} selected={location.pathname === '/config/usuarios'} onClick={() => handleNavigate('/config/usuarios')}>
              <ListItemIcon sx={{ color: '#fff', pl: openConfig && open ? 1 : 0 }}>
                <People />
              </ListItemIcon>
              {open && <ListItemText primary="Usuarios" />}
            </ListItem>
            <ListItem {...({ button: 'true' })} sx={{ pl: openConfig && open ? 4 : 0 }} selected={location.pathname === '/config/roles'} onClick={() => handleNavigate('/config/roles')}>
              <ListItemIcon sx={{ color: '#fff', pl: openConfig && open ? 1 : 0 }}>
                <Security />
              </ListItemIcon>
              {open && <ListItemText primary="Roles" />}
            </ListItem>
          </List>
        </Collapse>
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: open ? 2 : '16px 8px', display: 'flex', justifyContent: open ? 'flex-start' : 'center' }}> {/* Mantén el padding y alineación ajustados */}
        {open ? (
          <Button
            variant="contained"
            fullWidth
            startIcon={<Logout />}
            sx={{ backgroundColor: '#dc3545', color: 'white', '&:hover': { backgroundColor: '#c82333' } }}
            onClick={logout}
          >
            Cerrar Sesión
          </Button>
        ) : (
          <IconButton
            onClick={logout}
            sx={{ color: 'white', backgroundColor: '#dc3545', '&:hover': { backgroundColor: '#c82333' } }}
          >
            <Logout />
          </IconButton>
        )}
      </Box>
    </StyledDrawer>
  );
};

export default SideBar; 