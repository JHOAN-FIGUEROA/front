import { Box, useTheme, useMediaQuery, CssBaseline } from '@mui/material';
import { useState } from 'react';
import SideBar from './SideBar';
import Navbar from './Navbar';
import { useInactivityTimer } from '../hooks/useInactivityTimer';
import DashBoard from './DashBoard';

const drawerWidth = 240;
const closedDrawerWidth = 64;
const breakpoint = 'md';
const navbarHeight = '72px'; // Altura fija del Navbar

const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Usar el hook del temporizador de inactividad
  useInactivityTimer();

  // Handler para el toggle en desktop (sidebar permanente)
  const handleDesktopToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handler para el toggle en mobile (drawer temporal)
  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  // Calcular el ancho real del Drawer abierto/cerrado en modo permanente
  const desktopDrawerWidth = sidebarOpen ? drawerWidth : closedDrawerWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Navbar fijo en la parte superior, ocupa todo el ancho */}
      {/* Pasa el handler de toggle de mobile al Navbar */}
      <Navbar onMenuToggle={handleMobileToggle} navbarHeight={navbarHeight} desktopDrawerWidth={desktopDrawerWidth} sidebarOpen={sidebarOpen} isMobile={isMobile} />{/* <- Pasar info para alineación */}

      {/* Sidebar/Drawer */}
      <SideBar
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : sidebarOpen}
        onClose={handleDrawerClose} // Handler para cerrar drawer temporal
        onToggleDesktop={handleDesktopToggle} // Handler para toggle en desktop sidebar
        navbarHeight={navbarHeight} // Pasar altura del Navbar
        closedDrawerWidth={closedDrawerWidth} // Pasar ancho cerrado
        sidebarOpen={sidebarOpen} // Pasar estado de abierto/cerrado
      />

      {/* Contenedor principal del contenido */}
      {/* Ajustar padding y permitir scroll vertical en este contenedor */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100vw',
          position: 'relative',
          paddingLeft: isMobile ? 0 : `${desktopDrawerWidth}px`,
          paddingTop: navbarHeight,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'hidden',
          height: '100vh',
          transition: theme.transitions.create('padding-left', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          zIndex: theme.zIndex.drawer -1,
        }}
      >
        {/* Contenedor interno para limitar el ancho, centrar y manejar su propio scroll si es necesario */}
        <Box sx={{
          width: '100%',
          padding: (Array.isArray(children) ? children.some(child => child?.type === DashBoard) : children?.type === DashBoard) ? 0 : '16px',
          boxSizing: 'border-box',
          height: '100vh',
          overflowY: 'hidden',
        }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout; 