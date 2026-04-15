export type VehicleType = 'gas' | 'diesel' | 'electric' | 'hybrid' | 'bi_fuel';

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  type: VehicleType;
  odometer: number;
  fuelCapacity?: number;     // liters (gas/diesel/hybrid/primary)
  secondaryFuelCapacity?: number; // liters (for bi_fuel LPG/LNG tank)
  batteryCapacity?: number;  // kWh (electric/hybrid)
  batteryPercent?: number;   // current EV charge
  fullRangeKm?: number;     // EV full charge range
  color: string;             // avatar color
  createdAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  station?: string;
  fuelType?: 'primary' | 'secondary'; // distinguishing tanks for bi_fuel
  fullTank: boolean;
  notes?: string;
  distance?: number; // calculated from previous log
}

export interface TripLog {
  id: string;
  vehicleId: string;
  date: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  purpose: string;
  fuelUsed?: number;
  costEstimate?: number;
  uberComparison?: number;
  taxiComparison?: number;
  duration?: number; // minutes
}

export type MaintenanceType =
  | 'oil' | 'tires' | 'brakes' | 'battery'
  | 'filter' | 'inspection' | 'insurance' | 'other';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  odometer: number;
  nextDueDate?: string;
  nextDueOdometer?: number;
}

export type ExpenseCategory =
  | 'fuel' | 'maintenance' | 'insurance' | 'tax'
  | 'parking' | 'toll' | 'wash' | 'charging' | 'other';

export interface Expense {
  id: string;
  vehicleId: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptUri?: string;
}

export type DocumentType =
  | 'registration' | 'insurance' | 'inspection'
  | 'license' | 'receipt' | 'other';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;
  name: string;
  uri: string;
  expiryDate?: string;
  createdAt: string;
}

export interface SoloSession {
  id: string;
  vehicleId: string;
  startTime: string;
  endTime?: string;
  startOdometer: number;
  endOdometer?: number;
  trips: number;
  earnings: number;
  fuelCost: number;
  platform: string; // Uber, Bolt, etc.
}

export interface AppSettings {
  currency: string;
  distanceUnit: 'km' | 'mi';
  fuelUnit: 'liters' | 'gallons';
  notifications: boolean;
  darkMode: 'auto' | 'dark' | 'light';
}
