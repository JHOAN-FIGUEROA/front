import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const Buscador = ({ value, onChange, placeholder = 'Buscar...' }) => (
  <TextField
    label={placeholder}
    variant="outlined"
    size="small"
    value={value}
    onChange={onChange}
    sx={{ width: 300 }}
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