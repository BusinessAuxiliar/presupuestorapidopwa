import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  onPresupuestoMaterialesChange, 
  addMaterialToPresupuesto, 
  deleteMaterialFromPresupuesto, 
  updateMaterialQuantityInPresupuesto,
  onMaterialesChange,
  onPresupuestoChange, // Import new listener
  updateManoDeObra, // Import new update function
  type Material,
  type Presupuesto // Import new type
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
  InputLabel,
  Box,
  Stack // For layout
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // Import PDF icon

import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // This imports the autoTable plugin

interface MaterialEnPresupuestoDisplay {
  id: string;
  material_id: string;
  cantidad: number;
  nombreMaterial?: string;
  precioMaterial?: number;
}

const DetallePresupuestoScreen = () => {
  const { id } = useParams<{ id: string }>();
  const presupuestoId = id!;

  // States
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [materialesDelPresupuesto, setMaterialesDelPresupuesto] = useState<MaterialEnPresupuestoDisplay[]>([]);
  const [todosLosMateriales, setTodosLosMateriales] = useState<Material[]>([]);
  const [manoDeObraInput, setManoDeObraInput] = useState('');
  const [totalMateriales, setTotalMateriales] = useState(0);
  const [totalGeneral, setTotalGeneral] = useState(0);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | ''>('');
  const [cantidad, setCantidad] = useState('');
  const [materialToEdit, setMaterialToEdit] = useState<MaterialEnPresupuestoDisplay | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Effect for the main budget document
  useEffect(() => {
    if (!presupuestoId) return;
    const unsubscribe = onPresupuestoChange(presupuestoId, (data) => {
      setPresupuesto(data);
      setManoDeObraInput(data?.manoDeObra.toString() || '0');
    });
    return () => unsubscribe();
  }, [presupuestoId]);

  // Effect for the materials sub-collection
  useEffect(() => {
    if (!presupuestoId) return;
    const unsubscribe = onPresupuestoMaterialesChange(presupuestoId, (data) => {
      setMaterialesDelPresupuesto(data);
      const newTotal = data.reduce((acc, item) => acc + ((item.precioMaterial ?? 0) * item.cantidad), 0);
      setTotalMateriales(newTotal);
    });
    return () => unsubscribe();
  }, [presupuestoId]);

  // Effect for the list of all available materials
  useEffect(() => {
    const unsubscribe = onMaterialesChange((data) => {
      setTodosLosMateriales(data);
    });
    return () => unsubscribe();
  }, []);

  // Effect to calculate the grand total
  useEffect(() => {
    const manoDeObraCosto = presupuesto?.manoDeObra || 0;
    setTotalGeneral(totalMateriales + manoDeObraCosto);
  }, [totalMateriales, presupuesto]);

  // --- Handlers ---
  const handleUpdateManoDeObra = async () => {
    const costo = parseFloat(manoDeObraInput);
    if (isNaN(costo)) {
      setSnackbar({ open: true, message: 'El valor de la mano de obra debe ser un número.' });
      return;
    }
    try {
      await updateManoDeObra(presupuestoId, costo);
      setSnackbar({ open: true, message: 'Mano de obra actualizada.' });
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error al actualizar la mano de obra.' });
    }
  };

  const handleAddMaterial = async () => {
    if (selectedMaterialId && cantidad && presupuestoId) {
      try {
        await addMaterialToPresupuesto(presupuestoId, selectedMaterialId, parseFloat(cantidad));
        setAddDialogOpen(false);
        setSelectedMaterialId('');
        setCantidad('');
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
        setEditDialogOpen(false);
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

  const handleGeneratePdf = () => {
    if (!presupuesto) {
      setSnackbar({ open: true, message: 'No hay presupuesto para generar PDF.' });
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(`Presupuesto: ${presupuesto.nombre}`, 14, 22);

    // Materials Table
    doc.setFontSize(12);
    const tableColumn = ["Material", "Cantidad", "Precio Unitario", "Subtotal"];
    const tableRows: any[] = [];

    materialesDelPresupuesto.forEach(item => {
      const materialData = [
        item.nombreMaterial,
        item.cantidad,
        `$${(item.precioMaterial ?? 0).toFixed(2)}`,
        `$${((item.precioMaterial ?? 0) * item.cantidad).toFixed(2)}`,
      ];
      tableRows.push(materialData);
    });

    (doc as any).autoTable(tableColumn, tableRows, {
      startY: 30,
      headStyles: { fillColor: [0, 96, 100] }, // Primary color from theme
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { top: 25, left: 14, right: 14 },
    });

    // Totals
    let finalY = (doc as any).autoTable.previous.finalY;
    doc.setFontSize(12);
    doc.text(`Total Materiales: $${totalMateriales.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Mano de Obra: $${presupuesto.manoDeObra.toFixed(2)}`, 14, finalY + 18);
    doc.setFontSize(14);
    doc.text(`Total General: $${totalGeneral.toFixed(2)}`, 14, finalY + 28);

    // Save the PDF
    doc.save(`presupuesto-${presupuesto.nombre.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <Container sx={{ py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          {presupuesto?.nombre || 'Detalle del Presupuesto'}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleGeneratePdf}
          disabled={!presupuesto}
        >
          Descargar PDF
        </Button>
      </Stack>

      {/* Totals Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Total Materiales: ${totalMateriales.toFixed(2)}</Typography>
          <Typography variant="h6">Mano de Obra: ${presupuesto?.manoDeObra.toFixed(2) || '0.00'}</Typography>
          <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>Total General: ${totalGeneral.toFixed(2)}</Typography>
        </CardContent>
      </Card>

      {/* Labor Cost Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Mano de Obra</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Costo Mano de Obra"
              type="number"
              variant="outlined"
              size="small"
              value={manoDeObraInput}
              onChange={(e) => setManoDeObraInput(e.target.value)}
            />
            <Button variant="contained" onClick={handleUpdateManoDeObra}>Guardar</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Typography variant="h5" component="h2" gutterBottom>Materiales</Typography>
      <List>
        {materialesDelPresupuesto.map((item) => (
          <ListItem key={item.id} secondaryAction={
            <>
              <IconButton edge="end" onClick={() => { setMaterialToEdit(item); setCantidad(item.cantidad.toString()); setEditDialogOpen(true);}}><EditIcon /></IconButton>
              <IconButton edge="end" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
            </>
          }>
            <ListItemText 
              primary={item.nombreMaterial}
              secondary={`Cantidad: ${item.cantidad} - Subtotal: ${((item.precioMaterial ?? 0) * item.cantidad).toFixed(2)}`}
            />
          </ListItem>
        ))}
      </List>

      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 80, right: 16 }} onClick={() => setAddDialogOpen(true)}>
        <AddIcon />
      </Fab>

      {/* Add Material Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Añadir Material al Presupuesto</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Material</InputLabel>
            <Select
              value={selectedMaterialId}
              label="Material"
              onChange={(e) => setSelectedMaterialId(e.target.value as string)}
            >
              {todosLosMateriales.map((m) => (
                <MenuItem key={m.id} value={m.id}>{m.nombre} (${m.precio.toFixed(2)})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField margin="dense" label="Cantidad" type="number" fullWidth variant="standard" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleAddMaterial}>Añadir</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Quantity Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Editar Cantidad</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Nueva Cantidad" type="number" fullWidth variant="standard" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleUpdateQuantity}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Container>
  );
};

export default DetallePresupuestoScreen;