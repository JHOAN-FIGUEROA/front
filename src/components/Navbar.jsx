import { AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import logo from "../img/logotipo.PNG";
import { useAuth } from '../context/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme, useMediaQuery } from '@mui/material';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#4169E1', // Azul real
  minHeight: '72px', // Ajusta la altura mínima del AppBar
  boxShadow: theme.shadows[3], // Añadir sombra para distinción
}));

const Logo = styled('img')({
  height: 'calc(100% - 16px)',
  maxHeight: '56px',
  marginRight: '10px',
});

const StyledToolbar = styled(Toolbar)({
  height: '100%',
  display: 'flex',
  alignItems: 'center',
});

const Navbar = ({ onMenuToggle, navbarHeight = '72px', desktopDrawerWidth = 0, isMobile = false }) => {
  // Removed isAuthenticated and logout as the logout is now handled in the sidebar
  // const { isAuthenticated, logout } = useAuth();

  // Removed handleLogout as the logout is now handled in the sidebar
  // const handleLogout = () => {
  //   logout();
  // };

  const theme = useTheme();

  return (
    <StyledAppBar
      position="fixed"
      sx={{
         // ZIndex más alto que el sidebar
         zIndex: theme.zIndex.drawer + 2, // Un zIndex mayor que el sidebar
         // Ancho y margen ajustados en desktop
         width: isMobile ? '100%' : `calc(100% - ${desktopDrawerWidth}px)`,
         marginLeft: isMobile ? 0 : `${desktopDrawerWidth}px`, // Usar marginLeft en lugar de ml
         height: navbarHeight,
         // Añadir transición para width y marginLeft para sincronizar con sidebar
         transition: theme.transitions.create(['width', 'margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
         }),
      }}
    >
      <StyledToolbar>
        {/* Mostrar ícono de menú SOLO en mobile, usa onMenuToggle (handler de mobile) */}
        {isMobile && (
           <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuToggle}
            sx={{ mr: 2, color: 'white' }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {/* Eliminar ícono de menú para desktop de aquí */}
        <Logo src={logo} alt="PostWare Logo" />
        <Typography variant={isMobile ? 'h6' : 'h4'} component="div" sx={{ flexGrow: 1, textAlign: 'start', color: 'white' }}>
          POSTWARE
        </Typography>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Navbar;