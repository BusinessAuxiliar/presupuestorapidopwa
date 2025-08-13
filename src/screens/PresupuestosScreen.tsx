import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPresupuestos, addPresupuesto, deletePresupuesto, type Presupuesto } from '../db';
import {
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Snackbar,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const PresupuestosScreen = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [nombreError, setNombreError] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [presupuestoToDelete, setPresupuestoToDelete] = useState<number | null>(null);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const data = await getPresupuestos();
      setPresupuestos(data);
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error al cargar presupuestos.' });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClickOpen = () => {
    setNombre('');
    setNombreError(false);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleAddPresupuesto = async () => {
    if (!nombre.trim()) {
      setNombreError(true);
      return;
    }
    try {
      await addPresupuesto(nombre);
      setNombre('');
      loadData();
      handleClose();
      setSnackbar({ open: true, message: 'Presupuesto añadido.' });
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error al añadir presupuesto.' });
    }
  };

  const handleDeletePresupuesto = (id: number) => {
    setPresupuestoToDelete(id);
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (presupuestoToDelete !== null) {
      try {
        await deletePresupuesto(presupuestoToDelete);
        loadData();
        setSnackbar({ open: true, message: 'Presupuesto eliminado.' });
      } catch (error) {
        console.error(error);
        setSnackbar({ open: true, message: 'Error al eliminar presupuesto.' });
      } finally {
        setOpenConfirmDialog(false);
        setPresupuestoToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDialog(false);
    setPresupuestoToDelete(null);
  };

  const handleNavigateToDetail = (id: number) => {
    navigate(`/presupuesto/${id}`);
  };

  return (
    <Container sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mis Presupuestos
      </Typography>
      {presupuestos.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ mt: 4, textAlign: 'center' }}>
          No hay presupuestos aún. ¡Crea uno para empezar!
        </Typography>
      ) : (
        <List>
          {presupuestos.map((p: Presupuesto) => (
            <ListItem
              key={p.id}
              disablePadding
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeletePresupuesto(p.id!)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => handleNavigateToDetail(p.id!)}>
                <ListItemText
                  primary={p.nombre}
                  secondary={new Date(p.fecha).toLocaleDateString()}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={handleClickOpen}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Crear Nuevo Presupuesto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del presupuesto"
            type="text"
            fullWidth
            variant="standard"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (nombreError) setNombreError(false);
            }}
            error={nombreError}
            helperText={nombreError ? 'El nombre no puede estar vacío.' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleAddPresupuesto}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirmar Eliminación"}</DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            ¿Estás seguro de que quieres eliminar este presupuesto? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default PresupuestosScreen;