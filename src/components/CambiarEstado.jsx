import { useState } from 'react';
import { Switch, CircularProgress, Snackbar, Alert, Box } from '@mui/material';

const CambiarEstado = ({ id, estadoActual, onEstadoCambiado, loading: loadingProp = false, disabled = false, updateEstadoApi }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = async (e) => {
    const nuevoEstado = e.target.checked;
    setLoading(true);
    setError('');
    try {
      await updateEstadoApi(id, nuevoEstado);
      setSuccess(true);
      if (onEstadoCambiado) onEstadoCambiado(nuevoEstado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
      <Switch
        checked={!!estadoActual}
        onChange={handleChange}
        color="success"
        disabled={loading || loadingProp || disabled}
      />
      {loading && <CircularProgress size={18} sx={{ ml: 1 }} />}
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      <Snackbar open={success} autoHideDuration={2000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccess(false)}>Estado actualizado</Alert>
      </Snackbar>
    </Box>
  );
};

export default CambiarEstado; 