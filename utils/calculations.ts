/**
 * Vehicle health score, fuel economy, trip cost comparison, etc.
 */

import type { Vehicle, FuelLog, MaintenanceRecord, TripLog } from '../types';
import { daysUntil } from './formatters';

// ── Health Score (0-100) ───────────────────────────────────────
export function calculateHealthScore(
  vehicle: Vehicle,
  fuelLogs: FuelLog[],
  maintenance: MaintenanceRecord[],
): number {
  let score = 100;
  const now = new Date();
  const odo = vehicle.odometer;

  // ── 1. Mileage-based degradation ────────────────────────────
  // High-mileage vehicles start with a lower baseline
  if (odo > 300000) score -= 25;
  else if (odo > 200000) score -= 18;
  else if (odo > 150000) score -= 12;
  else if (odo > 100000) score -= 7;
  else if (odo > 50000) score -= 3;

  // ── 2. Vehicle age ──────────────────────────────────────────
  const age = new Date().getFullYear() - vehicle.year;
  if (age > 15) score -= 10;
  else if (age > 10) score -= 6;
  else if (age > 5) score -= 3;

  // ── 3. No data penalty ──────────────────────────────────────
  // Unknown maintenance history = not "excellent"
  if (maintenance.length === 0) {
    // The more km without ANY records, the worse it looks
    if (odo > 50000) score -= 15;
    else if (odo > 20000) score -= 10;
    else score -= 5;
  }
  if (fuelLogs.length === 0 && vehicle.type !== 'electric') {
    score -= 5; // no fuel tracking data at all
  }

  // ── 4. Overdue maintenance ──────────────────────────────────
  maintenance.forEach((m) => {
    if (m.nextDueDate) {
      const days = daysUntil(m.nextDueDate);
      if (days < -30) score -= 20;       // very overdue (>1 month)
      else if (days < 0) score -= 12;     // overdue
      else if (days < 14) score -= 4;     // due soon
    }
    if (m.nextDueOdometer && odo >= m.nextDueOdometer) {
      score -= 15; // past odometer threshold
    }
  });

  // ── 5. Maintenance freshness ────────────────────────────────
  if (maintenance.length > 0) {
    const sortedMaint = [...maintenance].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const lastService = new Date(sortedMaint[0].date);
    const monthsSinceService = (now.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsSinceService > 18) score -= 12;
    else if (monthsSinceService > 12) score -= 8;
    else if (monthsSinceService > 6) score -= 4;
  }

  // ── 6. Fuel economy trend ──────────────────────────────────
  if (fuelLogs.length >= 3) {
    const recent = fuelLogs.slice(-3);
    const validLogs = recent.filter(l => l.distance && l.distance > 0);
    if (validLogs.length > 0) {
      const avgEfficiency = validLogs.reduce(
        (sum, l) => sum + (l.liters / l.distance!) * 100, 0,
      ) / validLogs.length;

      if (avgEfficiency > 15) score -= 10;
      else if (avgEfficiency > 12) score -= 5;
    }
  }

  // ── 7. Logging consistency bonus ───────────────────────────
  // Reward users who actually track their vehicle
  if (fuelLogs.length >= 10) score += 5;
  else if (fuelLogs.length >= 5) score += 3;

  if (maintenance.length >= 5) score += 5;
  else if (maintenance.length >= 3) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getHealthLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#00D4AA' };
  if (score >= 60) return { label: 'Good', color: '#74B9FF' };
  if (score >= 40) return { label: 'Fair', color: '#FDCB6E' };
  if (score >= 20) return { label: 'Poor', color: '#E17055' };
  return { label: 'Critical', color: '#FF6B6B' };
}

// ── Fuel Economy ───────────────────────────────────────────────
export function calculateAvgConsumption(logs: FuelLog[], filterType?: 'primary' | 'secondary'): number {
  let filtered = logs;
  if (filterType === 'primary') {
    filtered = logs.filter((l) => !l.fuelType || l.fuelType === 'primary');
  } else if (filterType === 'secondary') {
    filtered = logs.filter((l) => l.fuelType === 'secondary');
  }

  const withDistance = filtered.filter((l) => l.distance && l.distance > 0);
  if (withDistance.length === 0) return 0;
  const totalLiters = withDistance.reduce((s, l) => s + l.liters, 0);
  const totalKm = withDistance.reduce((s, l) => s + (l.distance || 0), 0);
  return totalKm > 0 ? (totalLiters / totalKm) * 100 : 0;
}

export function calculateTotalFuelCost(logs: FuelLog[]): number {
  return logs.reduce((s, l) => s + l.totalCost, 0);
}

export function calculateCostPerKm(logs: FuelLog[], vehicleType: string = 'gas'): number {
  const totalCost = calculateTotalFuelCost(logs);
  const totalKm = logs.reduce((s, l) => s + (l.distance || 0), 0);
  
  if (totalKm > 0) return totalCost / totalKm;

  // Fallbacks if no fuel logs exist yet
  switch (vehicleType) {
    case 'electric': return 0.05; // EV charging is generally much cheaper
    case 'hybrid': return 0.08;
    case 'bi_fuel': return 0.09; // LPG/CNG is cheaper
    case 'diesel': return 0.11;
    case 'gas':
    default: return 0.14;
  }
}

// ── Trip Cost Comparison ───────────────────────────────────────
export function compareTripCost(
  distanceKm: number,
  ownCostPerKm: number,
): { own: number; uber: number; taxi: number; savings: number } {
  const own = distanceKm * ownCostPerKm;
  // Rough estimates (European city averages)
  const uberBase = 2.5;
  const uberPerKm = 1.2;
  const uber = uberBase + distanceKm * uberPerKm;

  const taxiBase = 3.5;
  const taxiPerKm = 1.8;
  const taxi = taxiBase + distanceKm * taxiPerKm;

  const bestAlternative = Math.min(uber, taxi);
  const savings = bestAlternative - own;

  return { own, uber, taxi, savings };
}

// ── Monthly Stats ──────────────────────────────────────────────
export function getMonthlyExpenses(
  fuelLogs: FuelLog[],
  maintenance: MaintenanceRecord[],
): { month: string; fuel: number; maintenance: number; total: number }[] {
  const months: Record<string, { fuel: number; maintenance: number }> = {};

  fuelLogs.forEach((l) => {
    const key = l.date.slice(0, 7); // YYYY-MM
    if (!months[key]) months[key] = { fuel: 0, maintenance: 0 };
    months[key].fuel += l.totalCost;
  });

  maintenance.forEach((m) => {
    const key = m.date.slice(0, 7);
    if (!months[key]) months[key] = { fuel: 0, maintenance: 0 };
    months[key].maintenance += m.cost;
  });

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month,
      fuel: data.fuel,
      maintenance: data.maintenance,
      total: data.fuel + data.maintenance,
    }));
}

// ── EV Calculations ────────────────────────────────────────────
export function calculateEVRange(batteryPercent: number, fullRangeKm: number): number {
  return (batteryPercent / 100) * fullRangeKm;
}

export function calculateChargeCost(kWh: number, pricePerKWh: number): number {
  return kWh * pricePerKWh;
}
