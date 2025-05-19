import { useState } from 'react';
import { Switch, CircularProgress, Snackbar, Alert } from '@mui/material';
import { updateEstadoUsuario } from '../api';

const CambiarEstado = ({ id, estadoActual, onEstadoCambiado, loading: loadingProp = false, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = async (e) => {
    const nuevoEstado = e.target.checked;
    setLoading(true);
    setError('');
    try {
      await updateEstadoUsuario(id, nuevoEstado);
      setSuccess(true);
      if (onEstadoCambiado) onEstadoCambiado(nuevoEstado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
    </>
  );
};

export default CambiarEstado; 