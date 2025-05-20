import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import PostWareLogo from "../img/PostWareLogo.png";
import { useAuth } from '../context/AuthContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#4169E1', // Azul real
  minHeight: '68px', // Ajusta la altura mínima del AppBar
}));

const Logo = styled('img')({
  height: '72px',
  marginRight: '10px',
});

const StyledToolbar = styled(Toolbar)({
  minHeight: '68px', // Ajusta la altura mínima del Toolbar para el logo
  display: 'flex',
  alignItems: 'center',
});

const LogoutButton = styled(Button)({
  backgroundColor: '#dc3545', // Rojo
  color: 'white',
  '&:hover': {
    backgroundColor: '#c82333', // Rojo más oscuro
  },
  marginLeft: 'auto', // Empuja el botón hacia la derecha
});

const Navbar = () => {
  // Removed isAuthenticated and logout as the logout is now handled in the sidebar
  // const { isAuthenticated, logout } = useAuth();

  // Removed handleLogout as the logout is now handled in the sidebar
  // const handleLogout = () => {
  //   logout();
  // };

  return (
    <StyledAppBar position="static">
      <StyledToolbar>
        <Logo src={PostWareLogo} alt="PostWare Logo" />
        
        {/* Removed logout button */}
        {/* {isAuthenticated && (
          <LogoutButton variant="contained" onClick={handleLogout}>
            Cerrar Sesión
          </LogoutButton>
        )} */}
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Navbar;