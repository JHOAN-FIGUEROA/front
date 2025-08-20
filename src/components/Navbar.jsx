import { AppBar, Toolbar, Typography, Button, IconButton, Box, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import logo from "../img/logotipo.PNG";
import { useAuth } from '../hooks/useAuth';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme, useMediaQuery } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

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

const UserInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: 'white',
  marginLeft: 'auto',
  [theme.breakpoints.down('sm')]: {
    display: 'none', // Ocultar en pantallas muy pequeñas
  },
}));

const UserDetails = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  lineHeight: 1.2,
});

const Navbar = ({ onMenuToggle, navbarHeight = '72px', desktopDrawerWidth = 0, isMobile = false, showUserInfo = false }) => {
  const { user } = useAuth();
  const theme = useTheme();

  // Función para obtener el nombre del rol basado en el ID del rol
  const getRoleName = (roleId) => {
    const roles = {
      1: 'Administrador',
      2: 'Vendedor',
      3: 'Comprador',
      4: 'Cliente'
    };
    return roles[roleId] || 'Usuario';
  };

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
        
        {/* Información del usuario - solo mostrar si showUserInfo es true y hay usuario */}
        {showUserInfo && user && (
          <UserInfo>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <PersonIcon />
            </Avatar>
            <UserDetails>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                {user.nombre || 'Usuario'}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
                {getRoleName(user.rol)}
              </Typography>
            </UserDetails>
          </UserInfo>
        )}
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Navbar;