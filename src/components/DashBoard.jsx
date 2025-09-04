import { useEffect, useState } from 'react';
import { Typography, Box, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../api';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
  const productosProximosAgotarse = stats?.productosProximosAgotarse || [];

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
          <ChartContainer title="Historial Ventas vs Compras" sx={{ width: '100%', flex: 1, minHeight: 0, height: '100%' }}>
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
          <ChartContainer title="Productos próximos a agotarse" sx={{ width: '100%', flex: 1, minHeight: 0, height: '100%', }}>
            <BarChart data={productosProximosAgotarse} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nombre" type="category" width={100} tick={{ fontSize: 12 }} />
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
    </Box>
  );
};

export default DashBoard;
