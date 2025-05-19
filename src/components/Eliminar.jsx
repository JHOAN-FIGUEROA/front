import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Snackbar, Alert, Typography } from '@mui/material';
import { deleteUsuario } from '../api';

const Eliminar = ({ id, open, onClose, onEliminado, nombre = '', loading: loadingProp = false, tipoEntidad = 'usuario', deleteApi }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEliminar = async () => {
    setLoading(true);
    setError('');
    try {
      if (deleteApi) {
        await deleteApi(id);
      } else {
        await deleteUsuario(id);
      }
      setSuccess(true);
      if (onEliminado) onEliminado();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar {tipoEntidad.charAt(0).toUpperCase() + tipoEntidad.slice(1)}</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro que deseas eliminar {tipoEntidad} <b>{nombre}</b>? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary" disabled={loading || loadingProp}>Cancelar</Button>
          <Button onClick={handleEliminar} color="error" disabled={loading || loadingProp}>
            {loading ? <CircularProgress size={18} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      <Snackbar open={success} autoHideDuration={2000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccess(false)}>Eliminado correctamente</Alert>
      </Snackbar>
    </>
  );
};

export default Eliminar; 