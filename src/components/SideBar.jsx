import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Collapse, IconButton, Box, Divider, Button } from '@mui/material';
import { Dashboard, Settings, People, Security, ExpandLess, ExpandMore, Menu, Logout } from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '@mui/material';

const drawerWidth = 240;
const closedDrawerWidth = 64; // Ancho cuando el sidebar está cerrado
const breakpoint = 'md';

const StyledDrawer = styled(Drawer)(({ theme, open, variant, navbarHeight }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(variant === 'permanent' && {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    width: open ? drawerWidth : closedDrawerWidth,
    position: 'fixed',
    height: '100vh',
    zIndex: theme.zIndex.drawer,
  }),
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    background: '#4169E1',
    color: '#fff',
    ...(variant === 'permanent' && {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflowX: 'hidden',
      width: open ? drawerWidth : closedDrawerWidth,
    }),
    ...(variant === 'temporary' && {
    }),
  },
}));

const SideBar = ({ variant, open, onClose, onToggleDesktop, navbarHeight }) => {
  const [openConfig, setOpenConfig] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));

  const handleConfigClick = () => {
    setOpenConfig(!openConfig);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (variant === 'temporary' && onClose) {
       onClose();
    }
  };

  return (
    <StyledDrawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
         display: { xs: variant === 'permanent' ? 'none' : 'block', md: 'block' },
         zIndex: isMobile ? theme.zIndex.drawer : theme.zIndex.drawer,
         navbarHeight: navbarHeight,
      }}
    >
      {variant === 'permanent' && (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, height: navbarHeight, justifyContent: open ? 'flex-end' : 'center', 
             position: 'absolute', top: 0, left: 0, right: 0,
             backgroundColor: theme.palette.primary.main,
             zIndex: theme.zIndex.drawer + 2
        }}>
           <IconButton onClick={onToggleDesktop} sx={{ color: 'white' }}>
              <Menu />
           </IconButton>
        </Box>
      )}
      <Divider />
      <List sx={{ paddingTop: navbarHeight }}>
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
      <Box sx={{ p: open ? 2 : '16px 8px', display: 'flex', justifyContent: open ? 'flex-start' : 'center' }}>
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