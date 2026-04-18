/**
 * Central data context managing all vehicles, logs, and records.
 * Acts as an Offline-First Optimistic Sync to Supabase.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getData, setData, KEYS } from '../utils/storage';
import { generateId, todayISO } from '../utils/formatters';
import { supabase, uploadImageToSupabase, uploadPrivateFileToSupabase } from '../utils/supabase';
import { useAuth } from './AuthContext';
import type {
  Vehicle, FuelLog, TripLog, MaintenanceRecord,
  Expense, VehicleDocument, SoloSession, VehicleCheck,
} from '../types';

// ── Converters for Postgres snake_case ───────────────────────
function toSnakeCaseObj(o: any): any {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(toSnakeCaseObj);
  const n: any = {};
  for (const key of Object.keys(o)) {
    const sn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    n[sn] = o[key];
  }
  return n;
}

function toCamelCaseObj(o: any): any {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(toCamelCaseObj);
  const n: any = {};
  for (const key of Object.keys(o)) {
    const ca = key.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace('_', ''));
    n[ca] = o[key];
  }
  return n;
}

interface DataState {
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  fuelLogs: FuelLog[];
  tripLogs: TripLog[];
  maintenance: MaintenanceRecord[];
  expenses: Expense[];
  documents: VehicleDocument[];
  soloSessions: SoloSession[];
  vehicleChecks: VehicleCheck[];
  isLoading: boolean;
}

interface DataContextType extends DataState {
  // Vehicle
  activeVehicle: Vehicle | null;
  setActiveVehicle: (id: string) => void;
  addVehicle: (v: Omit<Vehicle, 'id' | 'createdAt'>) => Promise<Vehicle>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  // Fuel
  vehicleFuelLogs: FuelLog[];
  addFuelLog: (log: Omit<FuelLog, 'id'>) => Promise<void>;
  updateFuelLog: (id: string, updates: Partial<FuelLog>) => Promise<void>;
  deleteFuelLog: (id: string) => Promise<void>;
  // Trips
  vehicleTripLogs: TripLog[];
  addTripLog: (log: Omit<TripLog, 'id'>) => Promise<void>;
  updateTripLog: (id: string, updates: Partial<TripLog>) => Promise<void>;
  deleteTripLog: (id: string) => Promise<void>;
  // Maintenance
  vehicleMaintenance: MaintenanceRecord[];
  addMaintenance: (rec: Omit<MaintenanceRecord, 'id'>) => Promise<void>;
  updateMaintenance: (id: string, updates: Partial<MaintenanceRecord>) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;
  // Expenses
  vehicleExpenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  // Documents
  vehicleDocuments: VehicleDocument[];
  addDocument: (doc: Omit<VehicleDocument, 'id' | 'createdAt'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  // Solo Sessions
  vehicleSoloSessions: SoloSession[];
  addSoloSession: (session: Omit<SoloSession, 'id'>) => Promise<void>;
  updateSoloSession: (id: string, updates: Partial<SoloSession>) => Promise<void>;
  deleteSoloSession: (id: string) => Promise<void>;
  // Vehicle Checks
  vehicleChecksForVehicle: VehicleCheck[];
  addVehicleCheck: (check: Omit<VehicleCheck, 'id'>) => Promise<void>;
  updateVehicleCheck: (id: string, updates: Partial<VehicleCheck>) => Promise<void>;
  deleteVehicleCheck: (id: string) => Promise<void>;
  // Refresh
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [state, setState] = useState<DataState>({
    vehicles: [],
    activeVehicleId: null,
    fuelLogs: [],
    tripLogs: [],
    maintenance: [],
    expenses: [],
    documents: [],
    soloSessions: [],
    vehicleChecks: [],
    isLoading: true,
  });

  const loadAll = useCallback(async () => {
    try {
      // If fully authenticated with Supabase, pull from cloud!
      if (status === 'authenticated' && !user?.isGuest && user?.id) {
          { data: vData }, { data: fData }, { data: tData }, 
          { data: mData }, { data: eData }, { data: dData }, { data: sData },
          { data: vcData }
        ] = await Promise.all([
          supabase.from('vehicles').select('*'),
          supabase.from('fuel_logs').select('*'),
          supabase.from('trip_logs').select('*'),
          supabase.from('maintenance').select('*'),
          supabase.from('expenses').select('*'),
          supabase.from('documents').select('*'),
          supabase.from('solo_sessions').select('*'),
          supabase.from('vehicle_checks').select('*'),
        ]);

        const vehicles = toCamelCaseObj(vData) || [];
        const activeId = await getData<string>(KEYS.ACTIVE_VEHICLE);

        setState({
          vehicles,
          activeVehicleId: activeId || (vehicles?.[0]?.id ?? null),
          fuelLogs: toCamelCaseObj(fData) || [],
          tripLogs: toCamelCaseObj(tData) || [],
          maintenance: toCamelCaseObj(mData) || [],
          expenses: toCamelCaseObj(eData) || [],
          documents: toCamelCaseObj(dData) || [],
          soloSessions: toCamelCaseObj(sData) || [],
          vehicleChecks: toCamelCaseObj(vcData) || [],
          isLoading: false,
        });
        
        // Also overwrite local cache so it works offline later
        await setData(KEYS.VEHICLES, vehicles);
        return;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local cache', e);
    }

    // Fallback: local storage (Offline or Guest Mode)
    const [vehicles, activeId, fuel, trips, maint, expenses, docs, solo, checks] = await Promise.all([
      getData<Vehicle[]>(KEYS.VEHICLES),
      getData<string>(KEYS.ACTIVE_VEHICLE),
      getData<FuelLog[]>(KEYS.FUEL_LOGS),
      getData<TripLog[]>(KEYS.TRIP_LOGS),
      getData<MaintenanceRecord[]>(KEYS.MAINTENANCE),
      getData<Expense[]>(KEYS.EXPENSES),
      getData<VehicleDocument[]>(KEYS.DOCUMENTS),
      getData<SoloSession[]>(KEYS.SOLO_SESSIONS),
      getData<VehicleCheck[]>(KEYS.VEHICLE_CHECKS),
    ]);

    setState({
      vehicles: vehicles || [],
      activeVehicleId: activeId || (vehicles?.[0]?.id ?? null),
      fuelLogs: fuel || [],
      tripLogs: trips || [],
      maintenance: maint || [],
      expenses: expenses || [],
      documents: docs || [],
      soloSessions: solo || [],
      vehicleChecks: checks || [],
      isLoading: false,
    });
  }, [status, user?.id, user?.isGuest]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Sync Helper ─────────────────────────────────────────────
  const syncToSupabase = async (table: string, method: 'insert' | 'update' | 'delete', payload: any) => {
    if (user?.isGuest || !user?.id) return; // Skip if guest
    
    try {
      let dbError = null;
      if (method === 'insert') {
        const { error } = await supabase.from(table).insert({ ...toSnakeCaseObj(payload), user_id: user.id });
        dbError = error;
      } else if (method === 'update') {
        const { id, ...rest } = payload;
        const { error } = await supabase.from(table).update(toSnakeCaseObj(rest)).eq('id', payload.id);
        dbError = error;
      } else if (method === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', payload.id);
        dbError = error;
      }

      if (dbError) {
        console.error(`Supabase ${method} error on ${table}:`, dbError);
        alert(`Cloud Sync Failed (${table}): ${dbError.message}. Your data was saved locally but not to the cloud!`);
      }
    } catch (e: any) {
      console.error(`Supabase sync exception for ${table}:`, e);
      alert(`Cloud Sync Exception: ${e.message}`);
    }
  };

  // ── Vehicle CRUD ───────────────────────────────────────────
  const setActiveVehicle = useCallback((id: string) => {
    setState((p) => ({ ...p, activeVehicleId: id }));
    setData(KEYS.ACTIVE_VEHICLE, id);
  }, []);

  const addVehicle = useCallback(async (v: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> => {
    const newId = generateId();
    let finalImageUri = v.imageUri;

    // Cloud Upload interception
    if (v.imageUri && v.imageUri.startsWith('file') && user?.id && !user?.isGuest) {
      const remoteUrl = await uploadImageToSupabase(v.imageUri, 'vehicle-avatars', `${user.id}/${newId}_${Date.now()}`);
      if (remoteUrl) finalImageUri = remoteUrl;
    }

    const newV: Vehicle = { ...v, id: newId, imageUri: finalImageUri, createdAt: todayISO() };
    const updated = [...state.vehicles, newV];
    setState((p) => ({ ...p, vehicles: updated, activeVehicleId: newV.id }));
    await setData(KEYS.VEHICLES, updated);
    await setData(KEYS.ACTIVE_VEHICLE, newV.id);
    syncToSupabase('vehicles', 'insert', newV);
    return newV;
  }, [state.vehicles, user]);

  const updateVehicle = useCallback(async (id: string, updates: Partial<Vehicle>) => {
    let finalUpdates = { ...updates };

    // Cloud Upload interception
    if (updates.imageUri && updates.imageUri.startsWith('file') && user?.id && !user?.isGuest) {
      const remoteUrl = await uploadImageToSupabase(updates.imageUri, 'vehicle-avatars', `${user.id}/${id}_${Date.now()}`);
      if (remoteUrl) finalUpdates.imageUri = remoteUrl;
    }

    const updated = state.vehicles.map((v) => (v.id === id ? { ...v, ...finalUpdates } : v));
    setState((p) => ({ ...p, vehicles: updated }));
    await setData(KEYS.VEHICLES, updated);
    syncToSupabase('vehicles', 'update', { id, ...finalUpdates });
  }, [state.vehicles, user]);

  const deleteVehicle = useCallback(async (id: string) => {
    const updated = state.vehicles.filter((v) => v.id !== id);
    const newActive = updated[0]?.id ?? null;
    setState((p) => ({
      ...p,
      vehicles: updated,
      activeVehicleId: p.activeVehicleId === id ? newActive : p.activeVehicleId,
    }));
    await setData(KEYS.VEHICLES, updated);
    if (state.activeVehicleId === id) await setData(KEYS.ACTIVE_VEHICLE, newActive);
    syncToSupabase('vehicles', 'delete', { id });
  }, [state.vehicles, state.activeVehicleId]);

  // ── Fuel CRUD ──────────────────────────────────────────────
  const addFuelLog = useCallback(async (log: Omit<FuelLog, 'id'>) => {
    const newLog: FuelLog = { ...log, id: generateId() };
    const updated = [newLog, ...state.fuelLogs];
    setState((p) => ({ ...p, fuelLogs: updated }));
    await setData(KEYS.FUEL_LOGS, updated);
    syncToSupabase('fuel_logs', 'insert', newLog);

    if (log.odometer > (state.vehicles.find(v => v.id === log.vehicleId)?.odometer || 0)) {
      updateVehicle(log.vehicleId, { odometer: log.odometer });
    }
  }, [state.fuelLogs, state.vehicles, updateVehicle]);

  const updateFuelLog = useCallback(async (id: string, updates: Partial<FuelLog>) => {
    const updated = state.fuelLogs.map((l) => (l.id === id ? { ...l, ...updates } : l));
    setState((p) => ({ ...p, fuelLogs: updated }));
    await setData(KEYS.FUEL_LOGS, updated);
    syncToSupabase('fuel_logs', 'update', { id, ...updates });
  }, [state.fuelLogs]);

  const deleteFuelLog = useCallback(async (id: string) => {
    const updated = state.fuelLogs.filter((l) => l.id !== id);
    setState((p) => ({ ...p, fuelLogs: updated }));
    await setData(KEYS.FUEL_LOGS, updated);
    syncToSupabase('fuel_logs', 'delete', { id });
  }, [state.fuelLogs]);

  // ── Trip CRUD ──────────────────────────────────────────────
  const addTripLog = useCallback(async (log: Omit<TripLog, 'id'>) => {
    const newLog: TripLog = { ...log, id: generateId() };
    const updated = [newLog, ...state.tripLogs];
    setState((p) => ({ ...p, tripLogs: updated }));
    await setData(KEYS.TRIP_LOGS, updated);
    syncToSupabase('trip_logs', 'insert', newLog);
  }, [state.tripLogs]);

  const updateTripLog = useCallback(async (id: string, updates: Partial<TripLog>) => {
    const updated = state.tripLogs.map((l) => (l.id === id ? { ...l, ...updates } : l));
    setState((p) => ({ ...p, tripLogs: updated }));
    await setData(KEYS.TRIP_LOGS, updated);
    syncToSupabase('trip_logs', 'update', { id, ...updates });
  }, [state.tripLogs]);

  const deleteTripLog = useCallback(async (id: string) => {
    const updated = state.tripLogs.filter((l) => l.id !== id);
    setState((p) => ({ ...p, tripLogs: updated }));
    await setData(KEYS.TRIP_LOGS, updated);
    syncToSupabase('trip_logs', 'delete', { id });
  }, [state.tripLogs]);

  // ── Maintenance CRUD ───────────────────────────────────────
  const addMaintenance = useCallback(async (rec: Omit<MaintenanceRecord, 'id'>) => {
    const newRec: MaintenanceRecord = { ...rec, id: generateId() };
    const updated = [newRec, ...state.maintenance];
    setState((p) => ({ ...p, maintenance: updated }));
    await setData(KEYS.MAINTENANCE, updated);
    syncToSupabase('maintenance', 'insert', newRec);
  }, [state.maintenance]);

  const updateMaintenance = useCallback(async (id: string, updates: Partial<MaintenanceRecord>) => {
    const updated = state.maintenance.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setState((p) => ({ ...p, maintenance: updated }));
    await setData(KEYS.MAINTENANCE, updated);
    syncToSupabase('maintenance', 'update', { id, ...updates });
  }, [state.maintenance]);

  const deleteMaintenance = useCallback(async (id: string) => {
    const updated = state.maintenance.filter((m) => m.id !== id);
    setState((p) => ({ ...p, maintenance: updated }));
    await setData(KEYS.MAINTENANCE, updated);
    syncToSupabase('maintenance', 'delete', { id });
  }, [state.maintenance]);

  // ── Expense CRUD ───────────────────────────────────────────
  const addExpense = useCallback(async (exp: Omit<Expense, 'id'>) => {
    const newExp: Expense = { ...exp, id: generateId() };
    const updated = [newExp, ...state.expenses];
    setState((p) => ({ ...p, expenses: updated }));
    await setData(KEYS.EXPENSES, updated);
    syncToSupabase('expenses', 'insert', newExp);
  }, [state.expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const updated = state.expenses.filter((e) => e.id !== id);
    setState((p) => ({ ...p, expenses: updated }));
    await setData(KEYS.EXPENSES, updated);
    syncToSupabase('expenses', 'delete', { id });
  }, [state.expenses]);

  // ── Document CRUD ──────────────────────────────────────────
  const addDocument = useCallback(async (doc: Omit<VehicleDocument, 'id' | 'createdAt'>) => {
    const newId = generateId();
    let finalUri = doc.uri;

    // Cloud Intercept for Private Documents
    if (doc.uri.startsWith('file') && user?.id && !user?.isGuest) {
      const internalPath = await uploadPrivateFileToSupabase(doc.uri, 'vehicle-documents', `${user.id}/${newId}_${Date.now()}`);
      if (internalPath) finalUri = internalPath;
    }

    const newDoc: VehicleDocument = { ...doc, id: newId, uri: finalUri, createdAt: todayISO() };
    const updated = [newDoc, ...state.documents];
    setState((p) => ({ ...p, documents: updated }));
    await setData(KEYS.DOCUMENTS, updated);
    syncToSupabase('documents', 'insert', newDoc);
  }, [state.documents, user]);

  const deleteDocument = useCallback(async (id: string) => {
    const updated = state.documents.filter((d) => d.id !== id);
    setState((p) => ({ ...p, documents: updated }));
    await setData(KEYS.DOCUMENTS, updated);
    syncToSupabase('documents', 'delete', { id });
  }, [state.documents]);

  // ── Solo Session CRUD ──────────────────────────────────────
  const addSoloSession = useCallback(async (session: Omit<SoloSession, 'id'>) => {
    const newSession: SoloSession = { ...session, id: generateId() };
    const updated = [newSession, ...state.soloSessions];
    setState((p) => ({ ...p, soloSessions: updated }));
    await setData(KEYS.SOLO_SESSIONS, updated);
    syncToSupabase('solo_sessions', 'insert', newSession);
  }, [state.soloSessions]);

  const updateSoloSession = useCallback(async (id: string, updates: Partial<SoloSession>) => {
    const updated = state.soloSessions.map(s => s.id === id ? { ...s, ...updates } : s);
    setState(p => ({ ...p, soloSessions: updated }));
    await setData(KEYS.SOLO_SESSIONS, updated);
    syncToSupabase('solo_sessions', 'update', { id, ...updates });
  }, [state.soloSessions]);

  const deleteSoloSession = useCallback(async (id: string) => {
    const updated = state.soloSessions.filter(s => s.id !== id);
    setState(p => ({ ...p, soloSessions: updated }));
    await setData(KEYS.SOLO_SESSIONS, updated);
    syncToSupabase('solo_sessions', 'delete', { id });
  }, [state.soloSessions]);

  // ── Vehicle Check CRUD ─────────────────────────────────────
  const addVehicleCheck = useCallback(async (check: Omit<VehicleCheck, 'id'>) => {
    const newCheck: VehicleCheck = { ...check, id: generateId() };
    const updated = [newCheck, ...state.vehicleChecks];
    setState((p) => ({ ...p, vehicleChecks: updated }));
    await setData(KEYS.VEHICLE_CHECKS, updated);
    syncToSupabase('vehicle_checks', 'insert', newCheck);
  }, [state.vehicleChecks]);

  const updateVehicleCheck = useCallback(async (id: string, updates: Partial<VehicleCheck>) => {
    const updated = state.vehicleChecks.map(c => c.id === id ? { ...c, ...updates } : c);
    setState((p) => ({ ...p, vehicleChecks: updated }));
    await setData(KEYS.VEHICLE_CHECKS, updated);
    syncToSupabase('vehicle_checks', 'update', { id, ...updates });
  }, [state.vehicleChecks]);

  const deleteVehicleCheck = useCallback(async (id: string) => {
    const updated = state.vehicleChecks.filter(c => c.id !== id);
    setState((p) => ({ ...p, vehicleChecks: updated }));
    await setData(KEYS.VEHICLE_CHECKS, updated);
    syncToSupabase('vehicle_checks', 'delete', { id });
  }, [state.vehicleChecks]);

  // ── Derived state ──────────────────────────────────────────
  const activeVehicle = state.vehicles.find((v) => v.id === state.activeVehicleId) ?? null;
  const vid = state.activeVehicleId;
  const vehicleFuelLogs = state.fuelLogs.filter((l) => l.vehicleId === vid);
  const vehicleTripLogs = state.tripLogs.filter((l) => l.vehicleId === vid);
  const vehicleMaintenance = state.maintenance.filter((m) => m.vehicleId === vid);
  const vehicleExpenses = state.expenses.filter((e) => e.vehicleId === vid);
  const vehicleDocuments = state.documents.filter((d) => d.vehicleId === vid);
  const vehicleSoloSessions = state.soloSessions.filter((s) => s.vehicleId === vid);
  const vehicleChecksForVehicle = state.vehicleChecks.filter((c) => c.vehicleId === vid);

  return (
    <DataContext.Provider
      value={{
        ...state,
        activeVehicle,
        setActiveVehicle,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        vehicleFuelLogs,
        addFuelLog,
        updateFuelLog,
        deleteFuelLog,
        vehicleTripLogs,
        addTripLog,
        updateTripLog,
        deleteTripLog,
        vehicleMaintenance,
        addMaintenance,
        updateMaintenance,
        deleteMaintenance,
        vehicleExpenses,
        addExpense,
        deleteExpense,
        vehicleDocuments,
        addDocument,
        deleteDocument,
        vehicleSoloSessions,
        addSoloSession,
        updateSoloSession,
        deleteSoloSession,
        vehicleChecksForVehicle,
        addVehicleCheck,
        updateVehicleCheck,
        deleteVehicleCheck,
        refresh: loadAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
