import Dexie, { type Table } from 'dexie';

// --- Interfaces (can be reused) ---
export interface Material {
  id?: number; // Optional for auto-increment
  nombre: string;
  precio: number;
}

export interface Presupuesto {
  id?: number;
  nombre: string;
  fecha: string;
}

export interface PresupuestoMaterial {
  id?: number;
  presupuesto_id: number;
  material_id: number;
  cantidad: number;
}

// --- Dexie Database Class ---
export class MySubClassedDexie extends Dexie {
  materiales!: Table<Material>;
  presupuestos!: Table<Presupuesto>;
  presupuesto_materiales!: Table<PresupuestoMaterial>;

  constructor() {
    super('presupuestosDB');
    this.version(1).stores({
      materiales: '++id, nombre',
      presupuestos: '++id, fecha',
      presupuesto_materiales: '++id, presupuesto_id, material_id',
    });
  }
}

export const db = new MySubClassedDexie();

// --- Wrapper Functions (to mimic the old API) ---

export const getMateriales = async (): Promise<Material[]> => {
  return db.materiales.toArray();
};

export const addMaterial = async (nombre: string, precio: number) => {
  return db.materiales.add({ nombre, precio });
};

export const updateMaterial = async (id: number, nombre: string, precio: number) => {
  return db.materiales.update(id, { nombre, precio });
};

export const deleteMaterial = async (id: number) => {
  await db.presupuesto_materiales.where('material_id').equals(id).delete();
  return db.materiales.delete(id);
};

export const getPresupuestos = async (): Promise<Presupuesto[]> => {
  return db.presupuestos.orderBy('fecha').reverse().toArray();
};

export const addPresupuesto = async (nombre: string): Promise<number | undefined> => {
  const fecha = new Date().toISOString();
  return db.presupuestos.add({ nombre, fecha });
};

export const deletePresupuesto = async (presupuesto_id: number) => {
  await db.presupuesto_materiales.where('presupuesto_id').equals(presupuesto_id).delete();
  return db.presupuestos.delete(presupuesto_id);
};

export const addMaterialToPresupuesto = async (presupuesto_id: number, material_id: number, cantidad: number) => {
  return db.presupuesto_materiales.add({ presupuesto_id, material_id, cantidad });
};

export const getMaterialesForPresupuesto = async (presupuesto_id: number): Promise<(Material & { cantidad: number; presupuesto_material_id: number })[]> => {
    const presupuestoMateriales = await db.presupuesto_materiales.where('presupuesto_id').equals(presupuesto_id).toArray();
    const materialIds = presupuestoMateriales.map(pm => pm.material_id);
    const materiales = await db.materiales.bulkGet(materialIds);

    return presupuestoMateriales.map(pm => {
        const material = materiales.find(m => m?.id === pm.material_id);
        if (!material) return null;
        return {
            ...material,
            cantidad: pm.cantidad,
            presupuesto_material_id: pm.id!,
        };
    }).filter(Boolean) as (Material & { cantidad: number; presupuesto_material_id: number })[];
};

export const deleteMaterialFromPresupuesto = async (presupuesto_material_id: number) => {
  return db.presupuesto_materiales.delete(presupuesto_material_id);
};

export const updateMaterialQuantityInPresupuesto = async (presupuesto_material_id: number, cantidad: number) => {
  return db.presupuesto_materiales.update(presupuesto_material_id, { cantidad });
};