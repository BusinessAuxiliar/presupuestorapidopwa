
import { Outlet, Link, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import CalculateIcon from '@mui/icons-material/Calculate';
import ConstructionIcon from '@mui/icons-material/Construction';

const Layout = () => {
  const location = useLocation();

  const getCurrentNavValue = () => {
    if (location.pathname === '/materiales') {
      return 1;
    }
    return 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto', pb: 7 }}>
        <Outlet />
      </Box>
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={getCurrentNavValue()}
        >
          <BottomNavigationAction
            label="Presupuestos"
            icon={<CalculateIcon />}
            component={Link}
            to="/"
          />
          <BottomNavigationAction
            label="Materiales"
            icon={<ConstructionIcon />}
            component={Link}
            to="/materiales"
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default Layout;