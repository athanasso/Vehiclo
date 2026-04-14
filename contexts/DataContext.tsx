/**
 * Central data context managing all vehicles, logs, and records.
 * Persists to AsyncStorage.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getData, setData, KEYS } from '../utils/storage';
import { generateId, todayISO } from '../utils/formatters';
import type {
  Vehicle, FuelLog, TripLog, MaintenanceRecord,
  Expense, VehicleDocument, SoloSession,
} from '../types';

interface DataState {
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  fuelLogs: FuelLog[];
  tripLogs: TripLog[];
  maintenance: MaintenanceRecord[];
  expenses: Expense[];
  documents: VehicleDocument[];
  soloSessions: SoloSession[];
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
  deleteFuelLog: (id: string) => Promise<void>;
  // Trips
  vehicleTripLogs: TripLog[];
  addTripLog: (log: Omit<TripLog, 'id'>) => Promise<void>;
  deleteTripLog: (id: string) => Promise<void>;
  // Maintenance
  vehicleMaintenance: MaintenanceRecord[];
  addMaintenance: (rec: Omit<MaintenanceRecord, 'id'>) => Promise<void>;
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
  // Refresh
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    vehicles: [],
    activeVehicleId: null,
    fuelLogs: [],
    tripLogs: [],
    maintenance: [],
    expenses: [],
    documents: [],
    soloSessions: [],
    isLoading: true,
  });

  const loadAll = useCallback(async () => {
    const [vehicles, activeId, fuel, trips, maint, expenses, docs, solo] = await Promise.all([
      getData<Vehicle[]>(KEYS.VEHICLES),
      getData<string>(KEYS.ACTIVE_VEHICLE),
      getData<FuelLog[]>(KEYS.FUEL_LOGS),
      getData<TripLog[]>(KEYS.TRIP_LOGS),
      getData<MaintenanceRecord[]>(KEYS.MAINTENANCE),
      getData<Expense[]>(KEYS.EXPENSES),
      getData<VehicleDocument[]>(KEYS.DOCUMENTS),
      getData<SoloSession[]>(KEYS.SOLO_SESSIONS),
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
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Persist helpers ────────────────────────────────────────
  const persist = useCallback(async (key: string, data: unknown) => {
    await setData(key, data);
  }, []);

  // ── Vehicle CRUD ───────────────────────────────────────────
  const setActiveVehicle = useCallback((id: string) => {
    setState((p) => ({ ...p, activeVehicleId: id }));
    persist(KEYS.ACTIVE_VEHICLE, id);
  }, [persist]);

  const addVehicle = useCallback(async (v: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> => {
    const newV: Vehicle = { ...v, id: generateId(), createdAt: todayISO() };
    const updated = [...state.vehicles, newV];
    setState((p) => ({ ...p, vehicles: updated, activeVehicleId: newV.id }));
    await persist(KEYS.VEHICLES, updated);
    await persist(KEYS.ACTIVE_VEHICLE, newV.id);
    return newV;
  }, [state.vehicles, persist]);

  const updateVehicle = useCallback(async (id: string, updates: Partial<Vehicle>) => {
    const updated = state.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v));
    setState((p) => ({ ...p, vehicles: updated }));
    await persist(KEYS.VEHICLES, updated);
  }, [state.vehicles, persist]);

  const deleteVehicle = useCallback(async (id: string) => {
    const updated = state.vehicles.filter((v) => v.id !== id);
    const newActive = updated[0]?.id ?? null;
    setState((p) => ({
      ...p,
      vehicles: updated,
      activeVehicleId: p.activeVehicleId === id ? newActive : p.activeVehicleId,
    }));
    await persist(KEYS.VEHICLES, updated);
    if (state.activeVehicleId === id) await persist(KEYS.ACTIVE_VEHICLE, newActive);
  }, [state.vehicles, state.activeVehicleId, persist]);

  // ── Fuel CRUD ──────────────────────────────────────────────
  const addFuelLog = useCallback(async (log: Omit<FuelLog, 'id'>) => {
    const newLog: FuelLog = { ...log, id: generateId() };
    const updated = [newLog, ...state.fuelLogs];
    setState((p) => ({ ...p, fuelLogs: updated }));
    await persist(KEYS.FUEL_LOGS, updated);
    // Update odometer
    if (log.odometer > (state.vehicles.find(v => v.id === log.vehicleId)?.odometer || 0)) {
      const updatedVehicles = state.vehicles.map(v =>
        v.id === log.vehicleId ? { ...v, odometer: log.odometer } : v
      );
      setState(p => ({ ...p, vehicles: updatedVehicles }));
      await persist(KEYS.VEHICLES, updatedVehicles);
    }
  }, [state.fuelLogs, state.vehicles, persist]);

  const deleteFuelLog = useCallback(async (id: string) => {
    const updated = state.fuelLogs.filter((l) => l.id !== id);
    setState((p) => ({ ...p, fuelLogs: updated }));
    await persist(KEYS.FUEL_LOGS, updated);
  }, [state.fuelLogs, persist]);

  // ── Trip CRUD ──────────────────────────────────────────────
  const addTripLog = useCallback(async (log: Omit<TripLog, 'id'>) => {
    const newLog: TripLog = { ...log, id: generateId() };
    const updated = [newLog, ...state.tripLogs];
    setState((p) => ({ ...p, tripLogs: updated }));
    await persist(KEYS.TRIP_LOGS, updated);
  }, [state.tripLogs, persist]);

  const deleteTripLog = useCallback(async (id: string) => {
    const updated = state.tripLogs.filter((l) => l.id !== id);
    setState((p) => ({ ...p, tripLogs: updated }));
    await persist(KEYS.TRIP_LOGS, updated);
  }, [state.tripLogs, persist]);

  // ── Maintenance CRUD ───────────────────────────────────────
  const addMaintenance = useCallback(async (rec: Omit<MaintenanceRecord, 'id'>) => {
    const newRec: MaintenanceRecord = { ...rec, id: generateId() };
    const updated = [newRec, ...state.maintenance];
    setState((p) => ({ ...p, maintenance: updated }));
    await persist(KEYS.MAINTENANCE, updated);
  }, [state.maintenance, persist]);

  const deleteMaintenance = useCallback(async (id: string) => {
    const updated = state.maintenance.filter((m) => m.id !== id);
    setState((p) => ({ ...p, maintenance: updated }));
    await persist(KEYS.MAINTENANCE, updated);
  }, [state.maintenance, persist]);

  // ── Expense CRUD ───────────────────────────────────────────
  const addExpense = useCallback(async (exp: Omit<Expense, 'id'>) => {
    const newExp: Expense = { ...exp, id: generateId() };
    const updated = [newExp, ...state.expenses];
    setState((p) => ({ ...p, expenses: updated }));
    await persist(KEYS.EXPENSES, updated);
  }, [state.expenses, persist]);

  const deleteExpense = useCallback(async (id: string) => {
    const updated = state.expenses.filter((e) => e.id !== id);
    setState((p) => ({ ...p, expenses: updated }));
    await persist(KEYS.EXPENSES, updated);
  }, [state.expenses, persist]);

  // ── Document CRUD ──────────────────────────────────────────
  const addDocument = useCallback(async (doc: Omit<VehicleDocument, 'id' | 'createdAt'>) => {
    const newDoc: VehicleDocument = { ...doc, id: generateId(), createdAt: todayISO() };
    const updated = [newDoc, ...state.documents];
    setState((p) => ({ ...p, documents: updated }));
    await persist(KEYS.DOCUMENTS, updated);
  }, [state.documents, persist]);

  const deleteDocument = useCallback(async (id: string) => {
    const updated = state.documents.filter((d) => d.id !== id);
    setState((p) => ({ ...p, documents: updated }));
    await persist(KEYS.DOCUMENTS, updated);
  }, [state.documents, persist]);

  // ── Solo Session CRUD ──────────────────────────────────────
  const addSoloSession = useCallback(async (session: Omit<SoloSession, 'id'>) => {
    const newSession: SoloSession = { ...session, id: generateId() };
    const updated = [newSession, ...state.soloSessions];
    setState((p) => ({ ...p, soloSessions: updated }));
    await persist(KEYS.SOLO_SESSIONS, updated);
  }, [state.soloSessions, persist]);

  const updateSoloSession = useCallback(async (id: string, updates: Partial<SoloSession>) => {
    const updated = state.soloSessions.map(s => s.id === id ? { ...s, ...updates } : s);
    setState(p => ({ ...p, soloSessions: updated }));
    await persist(KEYS.SOLO_SESSIONS, updated);
  }, [state.soloSessions, persist]);

  // ── Derived state ──────────────────────────────────────────
  const activeVehicle = state.vehicles.find((v) => v.id === state.activeVehicleId) ?? null;
  const vid = state.activeVehicleId;
  const vehicleFuelLogs = state.fuelLogs.filter((l) => l.vehicleId === vid);
  const vehicleTripLogs = state.tripLogs.filter((l) => l.vehicleId === vid);
  const vehicleMaintenance = state.maintenance.filter((m) => m.vehicleId === vid);
  const vehicleExpenses = state.expenses.filter((e) => e.vehicleId === vid);
  const vehicleDocuments = state.documents.filter((d) => d.vehicleId === vid);
  const vehicleSoloSessions = state.soloSessions.filter((s) => s.vehicleId === vid);

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
        deleteFuelLog,
        vehicleTripLogs,
        addTripLog,
        deleteTripLog,
        vehicleMaintenance,
        addMaintenance,
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
