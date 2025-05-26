import { useState } from 'react';
import { Switch, CircularProgress, Snackbar, Alert, Box } from '@mui/material';

const CambiarEstado = ({ id, estadoActual, onEstadoCambiado, loading: loadingProp = false, disabled = false, updateEstadoApi }) => {
  const [loading, setLoading] = useState(false);
  // El error local es para el Snackbar dentro de este componente, si se desea mantener.
  // Si se quiere centralizar todos los errores en el padre, este Snackbar podría eliminarse
  // y solo usar onEstadoCambiado para reportar errores.
  const [internalError, setInternalError] = useState(''); 
  const [internalSuccess, setInternalSuccess] = useState(false);

  const handleChange = async (e) => {
    const nuevoEstado = e.target.checked;
    setLoading(true);
    setInternalError('');
    setInternalSuccess(false); 
    try {
      await updateEstadoApi(id, nuevoEstado); // Llama a la función de API pasada como prop
      setInternalSuccess(true); // Para el Snackbar local de éxito
      if (onEstadoCambiado) {
        onEstadoCambiado(id, nuevoEstado, null); // Informa al padre del éxito
      }
    } catch (err) {
      const errorMessage = err.message || 'Error al cambiar el estado.';
      setInternalError(errorMessage); // Para el Snackbar local de error
      if (onEstadoCambiado) {
        // Informa al padre del error, devolviendo el estado original ya que el cambio falló
        onEstadoCambiado(id, estadoActual, errorMessage); 
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 40 }}> {/* Asegura algo de altura */}
      <Switch
        checked={!!estadoActual} // Asegura que sea booleano
        onChange={handleChange}
        color="success"
        disabled={loading || loadingProp || disabled}
        inputProps={{ 'aria-label': `switch-estado-${id}` }}
      />
      {loading && <CircularProgress size={18} sx={{ ml: 1 }} />}
      
      {/* Snackbar local para error (opcional si se maneja todo en el padre) */}
      <Snackbar 
        open={!!internalError} 
        autoHideDuration={3000} 
        onClose={() => setInternalError('')} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setInternalError('')} sx={{ width: '100%' }}>
          {internalError}
        </Alert>
      </Snackbar>
      
      {/* Snackbar local para éxito (opcional si se maneja todo en el padre) */}
      <Snackbar 
        open={internalSuccess} 
        autoHideDuration={2000} 
        onClose={() => setInternalSuccess(false)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setInternalSuccess(false)} sx={{ width: '100%' }}>
          Estado actualizado exitosamente
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CambiarEstado;