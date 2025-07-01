import { useEffect, useState } from 'react';
import { Typography, Box, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../api';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

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
        boxShadow: '0 80px 84px rgba(0,0,0,0.1)',
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
  const lastSale = stats?.ventasPorMes?.length > 0 ? stats.ventasPorMes[stats.ventasPorMes.length - 1].total : 0;
  const lastPurchase = stats?.comprasPorMes?.length > 0 ? stats.comprasPorMes[stats.comprasPorMes.length - 1].total : 0;

  return (
    <Box p={{ xs: 1, md: 2 }} sx={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
        Dashboard Principal
      </Typography>

      {/* KPIs */}
      <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }} mb={2} sx={{ height: '120px', minHeight: 0 }}>
        <Box flex={1} minWidth={0}>
          <KpiCard title="Total Clientes" value={stats?.totalClientes || 0} icon={<PeopleIcon fontSize="small" />} color="#29b6f6" />
        </Box>
        <Box flex={1} minWidth={0}>
          <KpiCard title="Ventas del Último Mes" value={formatCurrency(lastSale)} icon={<PointOfSaleIcon fontSize="small" />} color="#66bb6a" />
        </Box>
        <Box flex={1} minWidth={0}>
          <KpiCard title="Compras del Último Mes" value={formatCurrency(lastPurchase)} icon={<ShoppingCartIcon fontSize="small" />} color="#ffa726" />
        </Box>
      </Box>

      {/* Gráficas */}
      <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }} width="100%" flex={1} minHeight={0}>
        <Box flex={1} display="flex" flexDirection="column" gap={2} height="100%" minHeight={0}>
          <ChartContainer title="Ventas por mes" sx={{ width: '100%', flex: 1, minHeight: 0 }}>
            <AreaChart data={stats?.ventasPorMes} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short" }).format(value)} />
              <Tooltip content={renderCustomTooltip} formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="total" stroke="#66bb6a" fill="#66bb6a" fillOpacity={0.3} name="Total Ventas" />
            </AreaChart>
          </ChartContainer>
          <ChartContainer title="Compras por mes" sx={{ width: '100%', flex: 1, minHeight: 0 }}>
            <AreaChart data={stats?.comprasPorMes} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short" }).format(value)} />
              <Tooltip content={renderCustomTooltip} formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="total" stroke="#ffa726" fill="#ffa726" fillOpacity={0.3} name="Total Compras" />
            </AreaChart>
          </ChartContainer>
        </Box>
        <Box flex={1} display="flex" flexDirection="column" justifyContent="center" height="100%" minHeight={0}>
          <ChartContainer title="Productos más vendidos" sx={{ width: '100%', flex: 1, minHeight: 0 }}>
            <BarChart data={stats?.productosMasVendidos} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis dataKey="nombre" type="category" width={100} tick={{ fontSize: 12 }} />
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