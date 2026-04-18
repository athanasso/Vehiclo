export type VehicleType = 'gas' | 'diesel' | 'electric' | 'hybrid' | 'bi_fuel';

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  vin?: string;
  type: VehicleType;
  odometer: number;
  fuelCapacity?: number;     // liters (gas/diesel/hybrid/primary)
  secondaryFuelCapacity?: number; // liters (for bi_fuel LPG/LNG tank)
  batteryCapacity?: number;  // kWh (electric/hybrid)
  batteryPercent?: number;   // current EV charge
  fullRangeKm?: number;     // EV full charge range
  color: string;             // avatar color
  imageUri?: string;         // custom user uploaded car photo
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
  | 'filter' | 'inspection' | 'insurance' | 'other' | 'general' | 'lpg';

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
  notes?: string;
  customReminderDate?: string;
  customReminderNote?: string;
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

export type CheckStatus = 'good' | 'low' | 'needs_attention' | 'not_checked';

export type CheckItemKey =
  | 'engine_oil' | 'coolant' | 'brake_fluid' | 'washer_fluid'
  | 'tire_pressure' | 'tire_tread' | 'lights_front' | 'lights_rear'
  | 'wipers' | 'battery' | 'belts' | 'air_filter'
  | 'ac_system' | 'brakes' | 'exhaust';

export interface CheckItem {
  key: CheckItemKey;
  status: CheckStatus;
  note?: string;
}

export interface VehicleCheck {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  items: CheckItem[];
  overallNotes?: string;
  nextCheckDate?: string;
}

export interface AppSettings {
  currency: string;
  distanceUnit: 'km' | 'mi';
  fuelUnit: 'liters' | 'gallons';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  notifications: boolean;
  darkMode: 'auto' | 'dark' | 'light';
}
