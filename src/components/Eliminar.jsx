import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography } from '@mui/material';
import { deleteUsuario } from '../api';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/sweetAlert';

const Eliminar = ({ id, open, onClose, onEliminado, nombre = '', loading: loadingProp = false, tipoEntidad = 'usuario', deleteApi }) => {
  const [loading, setLoading] = useState(false);

  const handleEliminar = async () => {
    const confirmResult = await showConfirmAlert(
      `¿Eliminar ${tipoEntidad}?`,
      `¿Estás seguro que deseas eliminar ${tipoEntidad} ${nombre}? Esta acción no se puede deshacer.`
    );

    if (!confirmResult.isConfirmed) {
      return;
    }

    setLoading(true);
    try {
      if (deleteApi) {
        await deleteApi(id);
      } else {
        await deleteUsuario(id);
      }
      showSuccessAlert(
        `${tipoEntidad.charAt(0).toUpperCase() + tipoEntidad.slice(1)} Eliminado`,
        `El ${tipoEntidad} ha sido eliminado correctamente`
      );
      if (onEliminado) onEliminado();
    } catch (err) {
      showErrorAlert(
        'Error al Eliminar',
        err.message || `Ocurrió un error al eliminar el ${tipoEntidad}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
};

export default Eliminar; 