import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, MenuItem, CircularProgress, Snackbar, Alert } from '@mui/material';
import { createUsuario } from '../api';

const Crear = ({ open, onClose, onCreado, campos, loading: loadingProp = false, titulo = 'Registrar Usuario' }) => {
  const [form, setForm] = useState(() => Object.fromEntries(campos.map(c => [c.name, c.default || ''])));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createUsuario(form);
      setSuccess(true);
      if (onCreado) onCreado(form);
      setForm(Object.fromEntries(campos.map(c => [c.name, c.default || ''])));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{titulo}</DialogTitle>
        <form onSubmit={handleSubmit} autoComplete="off">
          <DialogContent dividers>
            <Grid container spacing={2}>
              {campos.map(({ name, label, select, options, type = 'text', required = true }) => (
                <Grid xs={12} sm={6} key={name}>
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
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="secondary" disabled={loading || loadingProp}>Cancelar</Button>
            <Button type="submit" color="primary" disabled={loading || loadingProp}>
              {loading ? <CircularProgress size={18} /> : 'Registrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      <Snackbar open={success} autoHideDuration={2000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccess(false)}>Usuario registrado correctamente</Alert>
      </Snackbar>
    </>
  );
};

export default Crear;