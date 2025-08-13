
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
    </ThemeProvider>
  );
}

export default App;