import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  getDoc,
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

// --- Wrapper Functions ---

export const getMateriales = async (): Promise<Material[]> => {
  const snapshot = await getDocs(materialesCollection);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Material));
};

export const addMaterial = async (nombre: string, precio: number) => {
  return addDoc(materialesCollection, { nombre, precio });
};

export const updateMaterial = async (id: string, nombre: string, precio: number) => {
  const materialDoc = doc(db, 'materiales', id);
  return updateDoc(materialDoc, { nombre, precio });
};

export const deleteMaterial = async (id: string) => {
  // Note: This only deletes the material. It does not remove it from existing
  // presupuestos. A more robust solution would be to use a cloud function
  // to handle cascading deletes.
  const materialDoc = doc(db, 'materiales', id);
  return deleteDoc(materialDoc);
};

export const getPresupuestos = async (): Promise<Presupuesto[]> => {
  const q = query(presupuestosCollection, orderBy('fecha', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Presupuesto));
};

export const addPresupuesto = async (nombre: string): Promise<string> => {
  const fecha = new Date().toISOString();
  const newPresupuesto = await addDoc(presupuestosCollection, { nombre, fecha });
  return newPresupuesto.id;
};

export const deletePresupuesto = async (presupuesto_id: string) => {
  const presupuestoDoc = doc(db, 'presupuestos', presupuesto_id);
  const presupuestoMaterialesCollection = collection(presupuestoDoc, 'materiales');

  // Delete all materials in the subcollection first
  const snapshot = await getDocs(presupuestoMaterialesCollection);
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Then delete the presupuesto itself
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
    // Denormalize for easier display
    nombreMaterial: materialData.nombre,
    precioMaterial: materialData.precio
  });
};

export const getMaterialesForPresupuesto = async (presupuesto_id: string): Promise<(Omit<PresupuestoMaterial, 'presupuesto_id'>)[]> => {
    const presupuestoMaterialesCollection = collection(db, 'presupuestos', presupuesto_id, 'materiales');
    const snapshot = await getDocs(presupuestoMaterialesCollection);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            material_id: data.material_id,
            cantidad: data.cantidad,
            nombreMaterial: data.nombreMaterial,
            precioMaterial: data.precioMaterial
        } as Omit<PresupuestoMaterial, 'presupuesto_id'>;
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
