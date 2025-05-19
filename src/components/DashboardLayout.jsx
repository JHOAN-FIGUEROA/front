import { Box } from '@mui/material';
import { useState } from 'react';
import SideBar from './SideBar';
import Footer from './Footer';

const drawerWidth = 240;

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SideBar open={sidebarOpen} onToggle={setSidebarOpen} />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin 0.3s',
          marginLeft: sidebarOpen ? `${drawerWidth}px` : '64px',
          width: `calc(100% - ${sidebarOpen ? drawerWidth : 64}px)`
        }}
      >
        <Box sx={{ flex: 1, width: '100%' }}>{children}</Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default DashboardLayout; 