
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import PresupuestosScreen from './screens/PresupuestosScreen';
import MaterialesScreen from './screens/MaterialesScreen';
import DetallePresupuestoScreen from './screens/DetallePresupuestoScreen';

// Define the theme based on the original app's theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#006064',
    },
    secondary: {
      main: '#ffab40',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<PresupuestosScreen />} />
            <Route path="materiales" element={<MaterialesScreen />} />
            <Route path="presupuesto/:id" element={<DetallePresupuestoScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <p style={{ position: 'fixed', bottom: 0, left: 0, zIndex: 9999, backgroundColor: 'rgba(255, 255, 0, 0.8)', padding: '5px', border: '1px solid black', fontSize: '12px' }}>
        Project ID: {import.meta.env.VITE_PROJECT_ID || 'NO ESTÁ CONFIGURADO'}
      </p>
    </ThemeProvider>
  );
}

export default App;