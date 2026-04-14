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

  // Deduct for overdue maintenance
  maintenance.forEach((m) => {
    if (m.nextDueDate) {
      const days = daysUntil(m.nextDueDate);
      if (days < 0) score -= 15; // overdue
      else if (days < 14) score -= 5; // due soon
    }
    if (m.nextDueOdometer && vehicle.odometer >= m.nextDueOdometer) {
      score -= 15;
    }
  });

  // Deduct if no maintenance in 6 months
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const recentMaint = maintenance.filter((m) => new Date(m.date) > sixMonthsAgo);
  if (recentMaint.length === 0 && maintenance.length > 0) score -= 10;

  // Deduct for poor fuel economy trend
  if (fuelLogs.length >= 3) {
    const recent = fuelLogs.slice(-3);
    const avgEfficiency = recent.reduce((sum, l) => {
      if (!l.distance || l.distance === 0) return sum;
      return sum + (l.liters / l.distance) * 100;
    }, 0) / recent.filter(l => l.distance && l.distance > 0).length;
    
    if (avgEfficiency > 12) score -= 5; // high consumption
    if (avgEfficiency > 15) score -= 10;
  }

  // Bonus for consistent logging
  if (fuelLogs.length >= 5) score += 5;
  if (maintenance.length >= 3) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function getHealthLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#00D4AA' };
  if (score >= 60) return { label: 'Good', color: '#74B9FF' };
  if (score >= 40) return { label: 'Fair', color: '#FDCB6E' };
  return { label: 'Needs Attention', color: '#FF6B6B' };
}

// ── Fuel Economy ───────────────────────────────────────────────
export function calculateAvgConsumption(logs: FuelLog[]): number {
  const withDistance = logs.filter((l) => l.distance && l.distance > 0);
  if (withDistance.length === 0) return 0;
  const totalLiters = withDistance.reduce((s, l) => s + l.liters, 0);
  const totalKm = withDistance.reduce((s, l) => s + (l.distance || 0), 0);
  return totalKm > 0 ? (totalLiters / totalKm) * 100 : 0;
}

export function calculateTotalFuelCost(logs: FuelLog[]): number {
  return logs.reduce((s, l) => s + l.totalCost, 0);
}

export function calculateCostPerKm(logs: FuelLog[]): number {
  const totalCost = calculateTotalFuelCost(logs);
  const totalKm = logs.reduce((s, l) => s + (l.distance || 0), 0);
  return totalKm > 0 ? totalCost / totalKm : 0;
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
