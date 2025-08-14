import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  getDoc,
  onSnapshot,
  Unsubscribe,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase'; // Import the initialized Firestore instance

// --- Interfaces (can be reused) ---
export interface Material {
  id: string; // Firestore uses strings for IDs
  nombre: string;
  precio: number;
}

export interface Presupuesto {
  id: string; // Firestore uses strings for IDs
  nombre: string;
  fecha: string;
}

export interface PresupuestoMaterial {
  id: string; // Firestore uses strings for IDs
  presupuesto_id: string;
  material_id: string;
  cantidad: number;
  // We can also store material details here to avoid extra reads
  nombreMaterial?: string;
  precioMaterial?: number;
}

// --- Collections ---
const materialesCollection = collection(db, 'materiales');
const presupuestosCollection = collection(db, 'presupuestos');

// --- Real-time Listener Functions ---

export const onMaterialesChange = (callback: (materiales: Material[]) => void): Unsubscribe => {
  const q = query(materialesCollection, orderBy('nombre'));
  return onSnapshot(q, snapshot => {
    const materiales = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Material));
    callback(materiales);
  });
};

export const onPresupuestosChange = (callback: (presupuestos: Presupuesto[]) => void): Unsubscribe => {
  const q = query(presupuestosCollection, orderBy('fecha', 'desc'));
  return onSnapshot(q, snapshot => {
    const presupuestos = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Presupuesto));
    callback(presupuestos);
  });
};

export const onPresupuestoMaterialesChange = (presupuesto_id: string, callback: (materiales: Omit<PresupuestoMaterial, 'presupuesto_id'>[]) => void): Unsubscribe => {
    const presupuestoMaterialesCollection = collection(db, 'presupuestos', presupuesto_id, 'materiales');
    return onSnapshot(presupuestoMaterialesCollection, snapshot => {
        const materiales = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                material_id: data.material_id,
                cantidad: data.cantidad,
                nombreMaterial: data.nombreMaterial,
                precioMaterial: data.precioMaterial
            } as Omit<PresupuestoMaterial, 'presupuesto_id'>;
        });
        callback(materiales);
    });
};


// --- Write/Update/Delete Functions (remain mostly the same) ---

export const addMaterial = async (nombre: string, precio: number) => {
  return addDoc(materialesCollection, { nombre, precio });
};

export const updateMaterial = async (id: string, nombre: string, precio: number) => {
  const materialDoc = doc(db, 'materiales', id);
  return updateDoc(materialDoc, { nombre, precio });
};

export const deleteMaterial = async (id: string) => {
  const materialDoc = doc(db, 'materiales', id);
  return deleteDoc(materialDoc);
};

export const addPresupuesto = async (nombre: string): Promise<string> => {
  const fecha = new Date().toISOString();
  const newPresupuesto = await addDoc(presupuestosCollection, { nombre, fecha });
  return newPresupuesto.id;
};

export const deletePresupuesto = async (presupuesto_id: string) => {
  const presupuestoDoc = doc(db, 'presupuestos', presupuesto_id);
  const presupuestoMaterialesCollection = collection(presupuestoDoc, 'materiales');

  const snapshot = await getDocs(presupuestoMaterialesCollection);
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  return deleteDoc(presupuestoDoc);
};

export const addMaterialToPresupuesto = async (presupuesto_id: string, material_id: string, cantidad: number) => {
  const materialDoc = await getDoc(doc(db, 'materiales', material_id));
  if (!materialDoc.exists()) {
    throw new Error("Material not found");
  }
  const materialData = materialDoc.data();

  const presupuestoMaterialesCollection = collection(db, 'presupuestos', presupuesto_id, 'materiales');
  return addDoc(presupuestoMaterialesCollection, {
    material_id,
    cantidad,
    nombreMaterial: materialData.nombre,
    precioMaterial: materialData.precio
  });
};

export const deleteMaterialFromPresupuesto = async (presupuesto_id: string, presupuesto_material_id: string) => {
  const materialDoc = doc(db, 'presupuestos', presupuesto_id, 'materiales', presupuesto_material_id);
  return deleteDoc(materialDoc);
};

export const updateMaterialQuantityInPresupuesto = async (presupuesto_id: string, presupuesto_material_id: string, cantidad: number) => {
  const materialDoc = doc(db, 'presupuestos', presupuesto_id, 'materiales', presupuesto_material_id);
  return updateDoc(materialDoc, { cantidad });
};