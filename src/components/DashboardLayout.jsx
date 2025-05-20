import { Box } from '@mui/material';
import { useState } from 'react';
import SideBar from './SideBar';
import Navbar from './Navbar';

const drawerWidth = 240;
const closedDrawerWidth = 64; // Asegúrate de que este valor coincida con el de SideBar.jsx

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SideBar open={sidebarOpen} onToggle={setSidebarOpen} />
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'padding-left 0.3s ease-in-out',
        }}
      >
        <Navbar />
        <Box sx={{ flex: 1, width: '100%', padding: '16px' }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout; 