import { useState, useEffect } from 'react';
import { onMaterialesChange, addMaterial, updateMaterial, deleteMaterial, type Material } from '../db';
import {
  Container,
  List,
  ListItem,
  ListItemText,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const MaterialesScreen = () => {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [stock, setStock] = useState('');
  const [nombreError, setNombreError] = useState(false);
  const [precioError, setPrecioError] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onMaterialesChange((data) => {
      setMateriales(data);
    });
    return () => unsubscribe();
  }, []);

  const handleOpen = (material: Material | null = null) => {
    if (material) {
      setIsEditing(true);
      setCurrentMaterial(material);
      setNombre(material.nombre);
      setPrecio(material.precio.toString());
      setCantidad(material.cantidad.toString());
      setStock(material.stock.toString());
    } else {
      setIsEditing(false);
      setCurrentMaterial(null);
      setNombre('');
      setPrecio('');
    }
    setNombreError(false);
    setPrecioError(false);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    let hasError = false;
    if (!nombre.trim()) {
      setNombreError(true);
      hasError = true;
    } else {
      setNombreError(false);
    }

    const parsedPrecio = parseFloat(precio);
    const parsedCantidad = parseFloat(cantidad);
    const parsedStock = parseFloat(stock);

    if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
      setPrecioError(true);
      hasError = true;
    } else {
      setPrecioError(false);
    }

    if (isNaN(parsedCantidad) || parsedCantidad < 0) {
      setSnackbar({ open: true, message: 'La cantidad debe ser un número válido mayor o igual a cero.' });
      hasError = true;
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      setSnackbar({ open: true, message: 'El stock debe ser un número válido mayor o igual a cero.' });
      hasError = true;
    }

    if (hasError) return;

    try {
      if (isEditing && currentMaterial?.id) {
        await updateMaterial(currentMaterial.id, nombre, parsedPrecio, parsedCantidad, parsedStock);
        setSnackbar({ open: true, message: 'Material actualizado.' });
      } else {
        await addMaterial(nombre, parsedPrecio, parsedCantidad, parsedStock);
        setSnackbar({ open: true, message: 'Material añadido.' });
      }
      handleClose();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error al guardar el material.' });
    }
  };

  const handleDelete = (id: string) => {
    setMaterialToDelete(id);
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (materialToDelete !== null) {
      try {
        await deleteMaterial(materialToDelete);
        setSnackbar({ open: true, message: 'Material eliminado.' });
      } catch (error) {
        console.error(error);
        setSnackbar({ open: true, message: 'Error al eliminar el material.' });
      } finally {
        setOpenConfirmDialog(false);
        setMaterialToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDialog(false);
    setMaterialToDelete(null);
  };

  return (
    <Container sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Materiales
      </Typography>
      {materiales.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ mt: 4, textAlign: 'center' }}>
          No hay materiales aún. ¡Añade uno para empezar!
        </Typography>
      ) : (
        <List>
          {materiales.map((m: Material) => (
            <ListItem
              key={m.id}
              disablePadding
              secondaryAction={
                <>
                  <IconButton edge="end" aria-label="edit" onClick={() => handleOpen(m)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(m.id)}>
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={m.nombre}
                secondary={`Precio: ${m.precio.toFixed(2)} - Cantidad: ${m.cantidad} - Stock: ${m.stock}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => handleOpen()}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Editar Material' : 'Nuevo Material'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del material"
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
          <TextField
            margin="dense"
            label="Precio"
            type="number"
            fullWidth
            variant="standard"
            value={precio}
            onChange={(e) => {
              setPrecio(e.target.value);
              if (precioError) setPrecioError(false);
            }}
            error={precioError}
            helperText={precioError ? 'El precio debe ser un número válido mayor que cero.' : ''}
          />
          <TextField
            margin="dense"
            label="Cantidad"
            type="number"
            fullWidth
            variant="standard"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Stock"
            type="number"
            fullWidth
            variant="standard"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
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
            ¿Estás seguro de que quieres eliminar este material? Esta acción no se puede deshacer.
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

export default MaterialesScreen;
