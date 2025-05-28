import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, MenuItem, CircularProgress } from '@mui/material';
import { createUsuario, createCliente } from '../api';
import { showErrorAlert } from '../utils/sweetAlert';

const Crear = ({ open, onClose, onCreado, campos, loading: loadingProp = false, titulo = 'Registrar Usuario', onError, tipo = 'usuario' }) => {
  const [form, setForm] = useState(() => Object.fromEntries(campos.map(c => [c.name, c.default || ''])));
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(Object.fromEntries(campos.map(c => [c.name, c.default || ''])));
      setValidationErrors({});
    }
  }, [open, campos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    campos.forEach(campo => {
      const value = form[campo.name];
      const trimmedValue = typeof value === 'string' ? value.trim() : value;

      if (campo.required !== false) {
        if (typeof trimmedValue === 'string' && !trimmedValue) {
          newErrors[campo.name] = `${campo.label} es requerido`;
          isValid = false;
        }
      }

      if (campo.name === 'email' && trimmedValue && !emailRegex.test(trimmedValue)) {
        newErrors[campo.name] = 'Formato de email inválido';
        isValid = false;
      }
    });

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    if (!validateForm()) {
      const validationErrorMsg = 'Por favor, corrija los errores en el formulario.';
      if (onError) {
        onError(validationErrorMsg);
      }
      showErrorAlert('Error de Validación', validationErrorMsg);
      return;
    }

    setLoading(true);
    try {
      const createFunction = tipo === 'cliente' ? createCliente : createUsuario;
      
      const dataToSend = { ...form };
      if (tipo === 'cliente' && dataToSend.documentocliente) {
        const docNumber = Number(dataToSend.documentocliente);
        if (isNaN(docNumber)) {
          const errorMsg = 'El número de documento no es un número válido.';
          setLoading(false);
          if (onError) onError(errorMsg);
          showErrorAlert('Error de Validación', errorMsg);
          return;
        }
        dataToSend.documentocliente = docNumber;
      }

      console.log('Datos enviados para crear ', tipo, ':', dataToSend);

      const response = await createFunction(dataToSend);

      setLoading(false);
      if (onCreado) onCreado(response);
      onClose();

    } catch (err) {
      setLoading(false);
      console.error(`Error al crear ${tipo}:`, err);

      if (err.response) {
        console.error(`Respuesta de error del backend:`, err.response);
      }

      let friendlyErrorMessage = `Ocurrió un error al crear el ${tipo}.`;
      let backendErrorDetails = err.response?.data?.detalles;
      let backendErrorMessage = err.response?.data?.error;
      let axiosErrorMessage = err.message;

      if (typeof backendErrorDetails === 'object' && backendErrorDetails !== null) {
        try {
          const fieldErrors = Object.entries(backendErrorDetails);
          if (fieldErrors.length > 0) {
            friendlyErrorMessage = fieldErrors
              .map(([key, messages]) => {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
                let messageText = '';
                if (Array.isArray(messages)) {
                  messageText = messages.join(', ');
                } else if (messages !== undefined && messages !== null) {
                  messageText = String(messages);
                } else {
                  messageText = 'Error desconocido';
                }
                return `${formattedKey}: ${messageText}`;
              })
              .join('; ');

            if (!friendlyErrorMessage) {
              friendlyErrorMessage = backendErrorMessage || axiosErrorMessage || friendlyErrorMessage;
            }
          }
        } catch (formatError) {
          console.error('Error formateando respuesta de error del backend (detalles):', formatError);
          friendlyErrorMessage = 'Error de validación con formato inesperado.';
        }
      } else if (typeof err.response?.data?.error === 'string') {
        friendlyErrorMessage = err.response.data.error;
      } else if (typeof err.response?.data === 'string') {
        friendlyErrorMessage = err.response.data;
      } else if (backendErrorMessage) {
        friendlyErrorMessage = backendErrorMessage;
      } else if (axiosErrorMessage) {
        friendlyErrorMessage = axiosErrorMessage;
      } else {
        friendlyErrorMessage = 'Error con formato de respuesta inesperado del servidor.';
      }

      const finalErrorMessage = typeof friendlyErrorMessage === 'string' && friendlyErrorMessage.length > 0 ? friendlyErrorMessage : 'Ocurrió un error desconocido.';

      if (onError) {
        onError(finalErrorMessage);
      }
      showErrorAlert('Error al Crear', finalErrorMessage);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{titulo}</DialogTitle>
        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <DialogContent dividers>
            <Grid container spacing={2}>
              {campos.map(({ name, label, select, options, type = 'text', required = true }) => (
                <Grid item xs={12} sm={select || type === 'password' ? 12 : 6} key={name}>
                  {select ? (
                    <TextField
                      select
                      label={label}
                      name={name}
                      value={form[name] || ''}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      required={required}
                      error={!!validationErrors[name]}
                      helperText={validationErrors[name]}
                    >
                      {Array.isArray(options) && options.map(opt => (
                        <MenuItem key={opt.value || opt} value={opt.value || opt}>
                          {opt.label || opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <TextField
                      label={label}
                      name={name}
                      value={form[name] || ''}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      type={type}
                      required={required}
                      error={!!validationErrors[name]}
                      helperText={validationErrors[name]}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="secondary" disabled={loading || loadingProp}>
              Cancelar
            </Button>
            <Button type="submit" color="primary" disabled={loading || loadingProp}>
              {loading ? <CircularProgress size={18} /> : 'Registrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default Crear;