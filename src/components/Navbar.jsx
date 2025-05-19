import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import PostWareLogo from "../img/PostWareLogo.png";
import { useAuth } from '../context/AuthContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#4169E1', // Azul real
}));

const Logo = styled('img')({
  height: '72px',
  marginRight: '10px',
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
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Logo src={PostWareLogo} alt="PostWare Logo" />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          PostWare
        </Typography>
        {isAuthenticated && (
          <LogoutButton variant="contained" onClick={handleLogout}>
            Cerrar Sesión
          </LogoutButton>
        )}
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar; 