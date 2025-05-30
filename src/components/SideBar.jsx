import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Collapse, IconButton, Box, Divider, Button } from '@mui/material';
import { Dashboard, Settings, People, Security, ExpandLess, ExpandMore, Menu, Logout, ShoppingCart, ShoppingBasket, Insights, Group } from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMediaQuery } from '@mui/material';
import { PERMISSIONS } from '../constants/permissions';
import LocalShipping from '@mui/icons-material/LocalShipping';
import PointOfSale from '@mui/icons-material/PointOfSale';
import Groups2 from '@mui/icons-material/Groups2';
import Category from '@mui/icons-material/Category';
import Inventory from '@mui/icons-material/Inventory';

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
  const [openCompras, setOpenCompras] = useState(false);
  const [openVentas, setOpenVentas] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));

  const handleConfigClick = () => {
    setOpenConfig(!openConfig);
  };

  const handleComprasClick = () => {
    setOpenCompras(!openCompras);
  };

  const handleVentasClick = () => {
    setOpenVentas(!openVentas);
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
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2, 
          height: navbarHeight, 
          justifyContent: open ? 'flex-end' : 'center', 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0,
          backgroundColor: '#4169E1',
          zIndex: theme.zIndex.drawer
        }}>
          <IconButton onClick={onToggleDesktop} sx={{ color: 'white' }}>
            <Menu />
          </IconButton>
        </Box>
      )}
      <Divider />
      <List sx={{ paddingTop: navbarHeight }}>
        {hasPermission(PERMISSIONS.DASHBOARD) && (
          <ListItem
            {...({ button: 'true' })}
            selected={location.pathname === '/dashboard'}
            onClick={() => handleNavigate('/dashboard')}
            sx={{
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          >
            <ListItemIcon sx={{ color: '#fff' }}>
              <Insights />
            </ListItemIcon>
            {open && <ListItemText primary="DashBoard" />}
          </ListItem>
        )}
        
        {(hasPermission(PERMISSIONS.USUARIOS) || hasPermission(PERMISSIONS.ROLES)) && (
          <>
            <ListItem {...({ button: 'true' })} onClick={handleConfigClick}>
              <ListItemIcon sx={{ color: '#fff' }}>
                <Settings />
              </ListItemIcon>
              {open && <ListItemText primary="Configuración" />}
              {open ? (openConfig ? <ExpandLess /> : <ExpandMore />) : null}
            </ListItem>
            <Collapse in={openConfig && open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {hasPermission(PERMISSIONS.USUARIOS) && (
                  <ListItem
                    {...({ button: 'true' })}
                    selected={location.pathname === '/config/usuarios'}
                    onClick={() => handleNavigate('/config/usuarios')}
                    sx={{
                      pl: openConfig && open ? 4 : 0,
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                      '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: '#fff', pl: openConfig && open ? 1 : 0 }}>
                      <People />
                    </ListItemIcon>
                    {open && <ListItemText primary="Usuarios" />}
                  </ListItem>
                )}
                {hasPermission(PERMISSIONS.ROLES) && (
                  <ListItem
                    {...({ button: 'true' })}
                    selected={location.pathname === '/config/roles'}
                    onClick={() => handleNavigate('/config/roles')}
                    sx={{
                      pl: openConfig && open ? 4 : 0,
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                      '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: '#fff', pl: openConfig && open ? 1 : 0 }}>
                      <Security />
                    </ListItemIcon>
                    {open && <ListItemText primary="Roles" />}
                  </ListItem>
                )}
              </List>
            </Collapse>
          </>
        )}
        
        {hasPermission(PERMISSIONS.PROVEEDORES) && (
  <>
    <ListItem {...({ button: 'true' })} onClick={handleComprasClick}>
      <ListItemIcon sx={{ color: '#fff' }}>
        <ShoppingBasket />
      </ListItemIcon>
      {open && <ListItemText primary="Compras" />}
      {open ? (openCompras ? <ExpandLess /> : <ExpandMore />) : null}
    </ListItem>
    <Collapse in={openCompras && open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {hasPermission(PERMISSIONS.PROVEEDORES) && (
          <ListItem
            {...({ button: 'true' })}
            selected={location.pathname === '/compras/proveedores'}
            onClick={() => handleNavigate('/compras/proveedores')}
            sx={{
              pl: openCompras && open ? 4 : 0,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          >
            <ListItemIcon sx={{ color: '#fff', pl: openCompras && open ? 1 : 0 }}>
              <LocalShipping />
            </ListItemIcon>
            {open && <ListItemText primary="Proveedores" />}
          </ListItem>
        )}

        {hasPermission(PERMISSIONS.CATEGORIAS) && (
          <ListItem
            {...({ button: 'true' })}
            selected={location.pathname === '/compras/categorias'}
            onClick={() => handleNavigate('/compras/categorias')}
            sx={{
              pl: openCompras && open ? 4 : 0,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          >
            <ListItemIcon sx={{ color: '#fff', pl: openCompras && open ? 1 : 0 }}>
              <Category />
            </ListItemIcon>
            {open && <ListItemText primary="Categorías" />}
          </ListItem>
        )}

        {hasPermission(PERMISSIONS.PRODUCTOS) && (
          <ListItem
            {...({ button: 'true' })}
            selected={location.pathname === '/compras/productos'}
            onClick={() => handleNavigate('/compras/productos')}
            sx={{
              pl: openCompras && open ? 4 : 0,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          >
            <ListItemIcon sx={{ color: '#fff', pl: openCompras && open ? 1 : 0 }}>
              <Inventory />
            </ListItemIcon>
            {open && <ListItemText primary="Productos" />}
          </ListItem>
        )}

        {hasPermission(PERMISSIONS.COMPRAS) && (
          <ListItem
            {...({ button: 'true' })}
            selected={location.pathname === '/compras'}
            onClick={() => handleNavigate('/compras')}
            sx={{
              pl: openCompras && open ? 4 : 0,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          >
            <ListItemIcon sx={{ color: '#fff', pl: openCompras && open ? 1 : 0 }}>
              <ShoppingBasket />
            </ListItemIcon>
            {open && <ListItemText primary="Compras" />}
          </ListItem>
        )}
        {hasPermission(PERMISSIONS.CATEGORÍAS) && (  // Asegúrate que coincida exactamente con tu constante
  <ListItem
    {...({ button: 'true' })}
    selected={location.pathname === '/compras/categorias'}
    onClick={() => handleNavigate('/compras/categorias')}
    sx={{
      pl: openCompras && open ? 4 : 0,
      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
      '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    }}
  >
    <ListItemIcon sx={{ color: '#fff', pl: openCompras && open ? 1 : 0 }}>
      <Category />
    </ListItemIcon>
    {open && <ListItemText primary="Categoría" />}
  </ListItem>
)}
      </List>
    </Collapse>
  </>
)}
        
        {(hasPermission(PERMISSIONS.VENTAS) || hasPermission(PERMISSIONS.CLIENTES)) && (
          <>
            <ListItem {...({ button: 'true' })} onClick={handleVentasClick}>
              <ListItemIcon sx={{ color: '#fff' }}>
                <PointOfSale />
              </ListItemIcon>
              {open && <ListItemText primary="Ventas" />}
              {open ? (openVentas ? <ExpandLess /> : <ExpandMore />) : null}
            </ListItem>
            <Collapse in={openVentas && open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {hasPermission(PERMISSIONS.CLIENTES) && (
                  <ListItem
                    {...({ button: 'true' })}
                    selected={location.pathname === '/ventas/clientes'}
                    onClick={() => handleNavigate('/ventas/clientes')}
                    sx={{
                      pl: openVentas && open ? 4 : 0,
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                      '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: '#fff', pl: openVentas && open ? 1 : 0 }}>
                      <Groups2/>
                    </ListItemIcon>
                    {open && <ListItemText primary="Clientes" />}
                  </ListItem>
                )}
                {hasPermission(PERMISSIONS.VENTAS) && (
                  <ListItem
                    {...({ button: 'true' })}
                    selected={location.pathname === '/ventas'}
                    onClick={() => handleNavigate('/ventas')}
                    sx={{
                      pl: openVentas && open ? 4 : 0,
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                      '&.Mui-selected': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: '#fff', pl: openVentas && open ? 1 : 0 }}>
                      <PointOfSale />
                    </ListItemIcon>
                    {open && <ListItemText primary="Ventas" />}
                  </ListItem>
                )}
              </List>
            </Collapse>
          </>
        )}
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