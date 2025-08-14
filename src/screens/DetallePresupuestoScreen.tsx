import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  onPresupuestoMaterialesChange, 
  addMaterialToPresupuesto, 
  deleteMaterialFromPresupuesto, 
  updateMaterialQuantityInPresupuesto,
  onMaterialesChange,
  type Material
} from '../db';
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
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface MaterialEnPresupuestoDisplay {
  id: string; // This is the ID of the presupuesto_material document
  material_id: string;
  cantidad: number;
  nombreMaterial?: string;
  precioMaterial?: number;
}

const DetallePresupuestoScreen = () => {
  const { id } = useParams<{ id: string }>();
  const presupuestoId = id;

  const [materialesDelPresupuesto, setMaterialesDelPresupuesto] = useState<MaterialEnPresupuestoDisplay[]>([]);
  const [todosLosMateriales, setTodosLosMateriales] = useState<Material[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | ''>('');
  const [cantidad, setCantidad] = useState('');
  const [materialToEdit, setMaterialToEdit] = useState<MaterialEnPresupuestoDisplay | null>(null);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  useEffect(() => {
    if (!presupuestoId) return;

    const unsubscribe = onPresupuestoMaterialesChange(presupuestoId, (data) => {
      setMaterialesDelPresupuesto(data);
      const newTotal = data.reduce((acc, item) => acc + ((item.precioMaterial ?? 0) * item.cantidad), 0);
      setTotal(newTotal);
    });

    return () => unsubscribe();
  }, [presupuestoId]);

  useEffect(() => {
    const unsubscribe = onMaterialesChange((data) => {
      setTodosLosMateriales(data);
    });
    return () => unsubscribe();
  }, []);

  // Add Dialog
  const handleAddDialogOpen = () => setAddDialogOpen(true);
  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
    setSelectedMaterialId('');
    setCantidad('');
  }

  // Edit Dialog
  const handleEditDialogOpen = (item: MaterialEnPresupuestoDisplay) => {
    setMaterialToEdit(item);
    setCantidad(item.cantidad.toString());
    setEditDialogOpen(true);
  };
  const handleEditDialogClose = () => setEditDialogOpen(false);

  const handleAddMaterial = async () => {
    if (selectedMaterialId && cantidad && presupuestoId) {
      try {
        await addMaterialToPresupuesto(presupuestoId, selectedMaterialId, parseFloat(cantidad));
        handleAddDialogClose();
        setSnackbar({ open: true, message: 'Material añadido.' });
      } catch (error) {
        console.error(error);
        setSnackbar({ open: true, message: 'Error al añadir material.' });
      }
    }
  };

  const handleUpdateQuantity = async () => {
    if (materialToEdit && cantidad && presupuestoId) {
      try {
        await updateMaterialQuantityInPresupuesto(presupuestoId, materialToEdit.id, parseFloat(cantidad));
        handleEditDialogClose();
        setSnackbar({ open: true, message: 'Cantidad actualizada.' });
      } catch (error) {
        console.error(error);
        setSnackbar({ open: true, message: 'Error al actualizar cantidad.' });
      }
    }
  };

  const handleDelete = async (presupuesto_material_id: string) => {
    if (!presupuestoId) return;
    try {
      await deleteMaterialFromPresupuesto(presupuestoId, presupuesto_material_id);
      setSnackbar({ open: true, message: 'Material eliminado.' });
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error al eliminar material.' });
    }
  };

  return (
    <Container sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Detalle del Presupuesto
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5">Total: ${total.toFixed(2)}</Typography>
        </CardContent>
      </Card>

      <List>
        {materialesDelPresupuesto.map((item) => (
          <ListItem
            key={item.id} // Use item.id (presupuesto_material document ID)
            secondaryAction={
              <>
                <IconButton edge="end" onClick={() => handleEditDialogOpen(item)}><EditIcon /></IconButton>
                <IconButton edge="end" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton> {/* Use item.id */}
              </>
            }
          >
            <ListItemText 
              primary={item.nombreMaterial} // Use nombreMaterial
              secondary={`Cantidad: ${item.cantidad} - Subtotal: ${((item.precioMaterial ?? 0) * item.cantidad).toFixed(2)}`} // Use precioMaterial
            />
          </ListItem>
        ))}
      </List>

      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 80, right: 16 }} onClick={handleAddDialogOpen}>
        <AddIcon />
      </Fab>

      {/* Add Material Dialog */}
      <Dialog open={addDialogOpen} onClose={handleAddDialogClose}>
        <DialogTitle>Añadir Material al Presupuesto</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Material</InputLabel>
            <Select
              value={selectedMaterialId}
              label="Material"
              onChange={(e) => setSelectedMaterialId(e.target.value as string)} // Changed to string
            >
              {todosLosMateriales.map((m: Material) => (
                <MenuItem key={m.id} value={m.id}>{m.nombre} (${m.precio.toFixed(2)})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField margin="dense" label="Cantidad" type="number" fullWidth variant="standard" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDialogClose}>Cancelar</Button>
          <Button onClick={handleAddMaterial}>Añadir</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Quantity Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Editar Cantidad</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Nueva Cantidad" type="number" fullWidth variant="standard" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancelar</Button>
          <Button onClick={handleUpdateQuantity}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Container>
  );
};

export default DetallePresupuestoScreen;