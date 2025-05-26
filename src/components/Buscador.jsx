import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const Buscador = ({ value, onChange, placeholder = 'Buscar...', sx = {} }) => (
  <TextField
    label={placeholder}
    variant="outlined"
    size="small"
    value={value}
    onChange={onChange}
    fullWidth // Hacer que ocupe todo el ancho disponible
    sx={{ ...sx }} // Permitir estilos adicionales
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      ),
    }}
  />
);

export default Buscador;