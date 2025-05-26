import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, MenuItem, CircularProgress, Snackbar, Alert } from '@mui/material';
import { createUsuario } from '../api';

const Crear = ({ open, onClose, onCreado, campos, loading: loadingProp = false, titulo = 'Registrar Usuario' }) => {
  const [form, setForm] = useState(() => Object.fromEntries(campos.map(c => [c.name, c.default || ''])));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(Object.fromEntries(campos.map(c => [c.name, c.default || ''])));
      setValidationErrors({});
      setError('');
      setSuccess(false);
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
        } else if (trimmedValue === null || trimmedValue === undefined || (typeof trimmedValue !== 'string' && !trimmedValue && trimmedValue !== 0)) {
            // Consider 0 as a valid number, but empty strings or null/undefined for non-strings are invalid
            if (!(typeof trimmedValue === 'number' && trimmedValue === 0)) {
                 newErrors[campo.name] = `${campo.label} es requerido`;
                 isValid = false;
            }
        }
      }

      if (campo.name === 'email' && trimmedValue && !emailRegex.test(trimmedValue)) {
        newErrors[campo.name] = 'Formato de email inválido';
        isValid = false;
      }
      
      if (campo.type === 'password' && campo.required !== false && !value) { // Password validation uses original value
        newErrors[campo.name] = `${campo.label} es requerida`;
        isValid = false;
      }
    });

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await createUsuario(form);
      setSuccess(true);
      if (onCreado) onCreado(form);
      // setForm(Object.fromEntries(campos.map(c => [c.name, c.default || '']))); // Reset handled by useEffect on 'open'
      // onClose(); // Optionally close on success
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detalles || err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
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
                <Grid item xs={12} sm={6} key={name}>
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
                      {options.map(opt => (
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
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="secondary" disabled={loading || loadingProp}>Cancelar</Button>
            <Button type="submit" color="primary" disabled={loading || loadingProp}>
              {loading ? <CircularProgress size={18} /> : 'Registrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={success} autoHideDuration={2000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccess(false)} sx={{ width: '100%' }}>
          Usuario registrado correctamente
        </Alert>
      </Snackbar>
    </>
  );
};

export default Crear;