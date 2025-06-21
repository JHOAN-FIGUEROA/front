import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Snackbar, Alert, Typography } from '@mui/material';
import { deleteUsuario } from '../api';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const Eliminar = ({ id, open, onClose, onEliminado, nombre = '', loading: loadingProp = false, tipoEntidad = 'usuario', deleteApi }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEliminar = async () => {
    // Validación especial para cliente de ventas rápidas
    if (tipoEntidad === 'cliente' && (id === '1010101010' || id === 1010101010)) {
      Swal.fire({
        icon: 'warning',
        title: 'Acción no permitida',
        text: 'No se puede eliminar el cliente para ventas rápidas',
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: { popup: 'animated fadeInDown' },
        didOpen: (popup) => { popup.style.zIndex = 99999; }
      });
      return;
    }
    setLoading(true);
    setError('');
    try {
      let response;
      if (deleteApi) {
        response = await deleteApi(id);
      } else {
        response = await deleteUsuario(id);
      }
      const mensaje = response?.data?.mensaje || response?.data?.data?.mensaje || 'Categoría eliminada correctamente';
      if (onEliminado) onEliminado(mensaje);
    } catch (err) {
      let errorMessage = err.message || 'Error al eliminar';

      if (errorMessage.includes('violates foreign key constraint')) {
        if (tipoEntidad === 'producto') {
          if (errorMessage.includes('compra')) {
            errorMessage = 'No se puede eliminar el producto, tiene compras asociadas.';
          } else if (errorMessage.includes('venta')) {
            errorMessage = 'No se puede eliminar el producto, tiene ventas asociadas.';
          } else {
            errorMessage = 'No se puede eliminar el producto porque está siendo usado en otros registros.';
          }
        } else if (tipoEntidad === 'proveedor') {
            errorMessage = 'No se puede eliminar el proveedor, tiene compras asociadas.';
        } else {
            errorMessage = `No se puede eliminar el ${tipoEntidad}, tiene registros asociados.`;
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'Error al Eliminar',
        text: errorMessage,
        confirmButtonColor: '#2E8B57',
        background: '#fff',
        customClass: { popup: 'animated fadeInDown' },
        didOpen: (popup) => { popup.style.zIndex = 99999; }
      });
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
    </>
  );
};

export default Eliminar; 