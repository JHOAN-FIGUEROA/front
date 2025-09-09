import { useEffect, useState } from 'react';
import { 
  Typography, Box, Grid, Paper, CircularProgress, Alert, Tooltip as MuiTooltip,
  Modal, Button, List, ListItem, ListItemText, ListItemIcon, Chip, IconButton
} from '@mui/material';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../api';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';

const KpiCard = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
    <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: color, color: '#fff', mr: 2 }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: '600', color: '#333' }}>{value}</Typography>
      <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
    </Box>
  </Paper>
);

const ChartContainer = ({ title, children, sx: sxProp }) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.3s ease-in-out',
      '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      },
      ...sxProp
    }}
  >
    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: '600', color: '#333' }}>
      {title}
    </Typography>
    <ResponsiveContainer>
      {children}
    </ResponsiveContainer>
  </Paper>
);

// Función para truncar texto con tooltip
const truncateText = (text, maxLength = 15) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Componente personalizado para etiquetas del YAxis con tooltip
const CustomYAxisTick = ({ x, y, payload }) => {
  const fullText = payload.value;
  const truncatedText = truncateText(fullText, 15);
  
  return (
    <g transform={`translate(${x},${y})`}>
      <MuiTooltip title={fullText} placement="left" arrow>
        <text 
          x={0} 
          y={0} 
          dy={4} 
          textAnchor="end" 
          fill="#666" 
          fontSize="12"
          style={{ cursor: 'help' }}
        >
          {truncatedText}
        </text>
      </MuiTooltip>
    </g>
  );
};

const renderCustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', p: 1, borderRadius: 1, boxShadow: 3, border: '1px solid #ddd' }}>
        <Typography sx={{ fontWeight: 'bold' }}>{label}</Typography>
        {payload.map((pld, index) => (
          <Typography key={index} sx={{ color: pld.color }}>
            {`${pld.name}: ${pld.value.toLocaleString('es-CO')}`}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const DashBoard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        if (response.success) {
          setStats(response.data);
        } else {
          throw new Error(response.message || 'Error al obtener las estadísticas');
        }
      } catch (err) {
        setError(err.message || 'Error de conexión o en el servidor');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 120px)">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ width: '100%' }}>
          <Typography fontWeight="bold">Error al cargar el Dashboard</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  const formatCurrency = (value) => `COP $${Number(value || 0).toLocaleString('es-CO')}`;

  // === Datos API ===
  const ventasDia = stats?.ventasDia || 0;
  const ventasMes = stats?.ventasMes || 0;
  const comprasMes = stats?.comprasMes || 0;
  const historialVentasCompras = stats?.historialVentasCompras || [];
  const topProductosMes = stats?.topProductosMes || [];
  const todosProductosProximosAgotarse = stats?.productosProximosAgotarse || [];
  // Ordenar por stock ascendente y tomar solo los 5 con menor stock
  const productosProximosAgotarse = todosProductosProximosAgotarse
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <Box p={{ xs: 1, md: 2 }} sx={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.2rem', sm: '1.5rem' }, mb: 1 }}>
        Dashboard Principal
      </Typography>

      {/* KPIs */}
      <Box display="flex" gap={1} flexDirection={{ xs: 'column', md: 'row' }} mb={1} sx={{ height: '90px', minHeight: 0 }}>
        <Box flex={1} minWidth={0}>
          <KpiCard title="Ventas del Día" value={formatCurrency(ventasDia)} icon={<PointOfSaleIcon fontSize="small" />} color="#43a047" />
        </Box>
        <Box flex={1} minWidth={0}>
          <KpiCard title="Ventas del Mes" value={formatCurrency(ventasMes)} icon={<PointOfSaleIcon fontSize="small" />} color="#66bb6a" />
        </Box>
        <Box flex={1} minWidth={0}>
          <KpiCard title="Compras del Mes" value={formatCurrency(comprasMes)} icon={<ShoppingCartIcon fontSize="small" />} color="#ffa726" />
        </Box>
      </Box>

      {/* Gráficas */}
      <Box display="flex" gap={1} flexDirection={{ xs: 'column', md: 'row' }} width="100%" flex={1} minHeight={0} height={0}>
        <Box flex={1} display="flex" flexDirection="column" gap={1} height="100%" minHeight={0}>
          {/* Historial Ventas vs Compras */}
          <ChartContainer 
            title={
              <Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: '600', color: '#333' }}>
                  Historial Ventas vs Compras
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                  Valores en pesos colombianos (COP) • M = Millones • K = Miles
                </Typography>
              </Box>
            }
            sx={{ width: '100%', flex: 1, minHeight: 0, height: '100%' }}
          >
            <AreaChart data={historialVentasCompras} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short" }).format(value)} />
              <Tooltip content={renderCustomTooltip} formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="ventas" stroke="#66bb6a" fill="#66bb6a" fillOpacity={0.3} name="Ventas" />
              <Area type="monotone" dataKey="compras" stroke="#ffa726" fill="#ffa726" fillOpacity={0.3} name="Compras" />
            </AreaChart>
          </ChartContainer>

          {/* Productos próximos a agotarse */}
          <ChartContainer 
            title={
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="h6" component="h3" sx={{ fontWeight: '600', color: '#333' }}>
                  Productos próximos a agotarse
                </Typography>
                {todosProductosProximosAgotarse.length > 5 && (
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => setModalOpen(true)}
                    sx={{ 
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      color: '#1976d2',
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                    }}
                  >
                    Ver más ({todosProductosProximosAgotarse.length})
                  </Button>
                )}
              </Box>
            }
            sx={{ width: '100%', flex: 1, minHeight: 0, height: '100%' }}
          >
            <BarChart data={productosProximosAgotarse} layout="vertical" margin={{ top: 5, right: 20, left: 140, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="nombre" 
                type="category" 
                width={130} 
                tick={<CustomYAxisTick />}
                interval={0}
              />
              <Tooltip content={renderCustomTooltip} />
              <Legend />
              <Bar dataKey="stock" fill="#ef5350" name="Stock" />
            </BarChart>
          </ChartContainer>
        </Box>

        {/* Top productos mes */}
        <Box flex={1} display="flex" flexDirection="column" justifyContent="center" height="100%" minHeight={0}>
          <ChartContainer title="Top 5 productos más vendidos (Mes)" sx={{ width: '100%', flex: 1, minHeight: 0, height: '100%' }}>
            <BarChart data={topProductosMes} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={renderCustomTooltip} />
              <Legend />
              <Bar dataKey="cantidad" fill="#29b6f6" name="Cantidad Vendida" />
            </BarChart>
          </ChartContainer>
        </Box>
      </Box>

      {/* Modal de productos próximos a agotarse */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box
          sx={{
            width: { xs: '90%', sm: '80%', md: '60%' },
            maxWidth: '800px',
            maxHeight: '80vh',
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header del modal */}
          <Box
            sx={{
              p: 3,
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: '#f8f9fa'
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <WarningAmberIcon sx={{ color: '#ff9800', fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                Productos Próximos a Agotarse
              </Typography>
            </Box>
            <IconButton onClick={() => setModalOpen(false)} sx={{ color: '#666' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Contenido del modal */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, px: 1 }}>
              Total de productos: {todosProductosProximosAgotarse.length}
            </Typography>
            
            <List sx={{ width: '100%' }}>
              {todosProductosProximosAgotarse
                .sort((a, b) => a.stock - b.stock)
                .map((producto, index) => {
                  const isLowStock = producto.stock <= 5;
                  const isCritical = producto.stock <= 2;
                  
                  return (
                    <ListItem
                      key={index}
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                        bgcolor: isCritical ? '#ffebee' : isLowStock ? '#fff3e0' : '#f5f5f5',
                        '&:hover': {
                          bgcolor: isCritical ? '#ffcdd2' : isLowStock ? '#ffe0b2' : '#eeeeee',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <ListItemIcon>
                        <InventoryIcon 
                          sx={{ 
                            color: isCritical ? '#d32f2f' : isLowStock ? '#f57c00' : '#666',
                            fontSize: 24
                          }} 
                        />
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: '600', color: '#333' }}>
                            {producto.nombre}
                          </Typography>
                        }
                        secondary={
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Stock disponible:
                            </Typography>
                            <Chip
                              label={`${producto.stock} unidades`}
                              size="small"
                              sx={{
                                bgcolor: isCritical ? '#f44336' : isLowStock ? '#ff9800' : '#4caf50',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        }
                      />
                      
                      <Box textAlign="right">
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: isCritical ? '#d32f2f' : isLowStock ? '#f57c00' : '#666'
                          }}
                        >
                          #{index + 1}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {isCritical ? 'Crítico' : isLowStock ? 'Bajo' : 'Normal'}
                        </Typography>
                      </Box>
                    </ListItem>
                  );
                })
              }
            </List>
          </Box>

          {/* Footer del modal */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #e0e0e0',
              bgcolor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button
              variant="contained"
              onClick={() => setModalOpen(false)}
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default DashBoard;
