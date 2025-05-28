import { useState, useEffect } from 'react';
import { Switch, CircularProgress, Snackbar, Alert, Box, Typography } from '@mui/material';

const CambiarEstado = ({ id, estadoActual, onEstadoCambiado, loading: loadingProp = false, disabled = false, updateEstadoApi }) => {
  const [loading, setLoading] = useState(false);
  // El error local es para el Snackbar dentro de este componente, si se desea mantener.
  // Si se quiere centralizar todos los errores en el padre, este Snackbar podría eliminarse
  // y solo usar onEstadoCambiado para reportar errores.
  const [internalError, setInternalError] = useState(''); 
  const [internalSuccess, setInternalSuccess] = useState(false);

  // Validar ID: debe ser un string no vacío O un número
  const isIdValid = (id !== undefined && id !== null && id !== '') && (typeof id === 'string' || typeof id === 'number');

  // Reset internal state when relevant props change
  useEffect(() => {
    setLoading(false);
    setInternalError('');
    setInternalSuccess(false);
  }, [id, updateEstadoApi]);

  const handleChange = async (e) => {
    // Esta validación ahora solo verifica si isIdValid ya es true
    if (!isIdValid) {
      console.error('Intento de cambio de estado con ID no válido (en handleChange).', id);
      setInternalError('Identificador no válido.'); // Mensaje más genérico
      // No llamar a onEstadoCambiado aquí con error de validación interna
      return;
    }

    const nuevoEstado = e.target.checked;
    setLoading(true);
    setInternalError('');
    setInternalSuccess(false);
    
    try {
      await updateEstadoApi(id, nuevoEstado);
      setInternalSuccess(true);
      if (onEstadoCambiado) {
        onEstadoCambiado(id, nuevoEstado, null);
      }
    } catch (err) {
      const errorMessage = err.message || 'Error al cambiar el estado.';
      setInternalError(errorMessage);
      if (onEstadoCambiado) {
        onEstadoCambiado(id, estadoActual, errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 40 }}> {/* Asegura algo de altura */}
      {!isIdValid ? (
        // Mostrar un mensaje de error si el ID no es válido
        <Typography variant="body2" color="error">ID inválido</Typography>
      ) : (
        // Renderizar el switch solo si el ID es válido
        <Switch
          checked={estadoActual}
          onChange={handleChange}
          color="success"
          // Deshabilitar basado en loading y props externas, no en la validez del ID inicial
          disabled={loading || loadingProp || disabled}
          inputProps={{ 'aria-label': `switch-estado-${id}` }}
        />
      )}
      
      {/* Mostrar CircularProgress solo si loading es true y el switch está visible y no deshabilitado externamente */}
      {loading && isIdValid && !(loadingProp || disabled) && <CircularProgress size={18} sx={{ ml: 1 }} />}
      
      {/* Snackbar local para error (solo errores API o validación interna) */}
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
      
      {/* Snackbar local para éxito */}
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