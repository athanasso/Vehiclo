/**
 * Dashboard — Health score, quick stats, alerts, quick actions.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import {
  useThemeColors, Card, GlassCard, StatCard, QuickAction,
  SectionHeader, AlertBanner, EmptyState, Badge,
} from '@/components/ui';
import { HealthGauge } from '@/components/HealthGauge';
import { VehicleSelector } from '@/components/VehicleSelector';
import { MiniBarChart } from '@/components/MiniBarChart';
import { useData } from '@/contexts/DataContext';
import {
  calculateHealthScore, calculateAvgConsumption,
  calculateCostPerKm, calculateTotalFuelCost,
} from '@/utils/calculations';
import {
  formatCurrency, formatDistanceFull, formatFuelEfficiency, formatRelativeDate,
  daysUntil,
} from '@/utils/formatters';

export default function DashboardScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    vehicles, activeVehicle, vehicleFuelLogs, vehicleMaintenance,
    vehicleTripLogs, vehicleExpenses,
  } = useData();

  const healthScore = useMemo(() => {
    if (!activeVehicle) return 0;
    return calculateHealthScore(activeVehicle, vehicleFuelLogs, vehicleMaintenance);
  }, [activeVehicle, vehicleFuelLogs, vehicleMaintenance]);

  const avgConsumption = useMemo(() => calculateAvgConsumption(vehicleFuelLogs), [vehicleFuelLogs]);
  const costPerKm = useMemo(() => calculateCostPerKm(vehicleFuelLogs), [vehicleFuelLogs]);
  const totalFuelCost = useMemo(() => calculateTotalFuelCost(vehicleFuelLogs), [vehicleFuelLogs]);

  // Upcoming maintenance alerts
  const upcomingAlerts = useMemo(() => {
    return vehicleMaintenance
      .filter((m) => m.nextDueDate)
      .map((m) => ({ ...m, daysLeft: daysUntil(m.nextDueDate!) }))
      .filter((m) => m.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [vehicleMaintenance]);

  // Monthly expenses for chart
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    const allItems = [
      ...vehicleFuelLogs.map((l) => ({ date: l.date, amount: l.totalCost })),
      ...vehicleMaintenance.map((m) => ({ date: m.date, amount: m.cost })),
      ...vehicleExpenses.map((e) => ({ date: e.date, amount: e.amount })),
    ];
    allItems.forEach(({ date, amount }) => {
      const key = date.slice(0, 7);
      months[key] = (months[key] || 0) + amount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, value]) => ({
        label: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
        value,
        color: Brand.primary,
      }));
  }, [vehicleFuelLogs, vehicleMaintenance, vehicleExpenses]);

  // No vehicles yet — onboarding
  if (vehicles.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: Spacing.xl }}>
          <View style={{ alignItems: 'center', marginBottom: Spacing['3xl'] }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: Brand.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.xl,
              }}
            >
              <Ionicons name="car-sport" size={48} color={Brand.primary} />
            </View>
            <Text style={{ color: c.text, fontSize: FontSizes['3xl'], fontWeight: '800', textAlign: 'center' }}>
              Welcome to Vehiclo
            </Text>
            <Text
              style={{
                color: c.textSecondary,
                fontSize: FontSizes.md,
                textAlign: 'center',
                marginTop: Spacing.sm,
                lineHeight: 22,
              }}
            >
              Your AI-powered vehicle manager.{'\n'}Add your first vehicle to get started.
            </Text>
          </View>
          <GlassCard
            onPress={() => router.push('/modals/add-vehicle')}
            style={{ alignItems: 'center', gap: Spacing.md }}
          >
            <Ionicons name="add-circle" size={40} color={Brand.primary} />
            <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>
              Add Your Vehicle
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm, textAlign: 'center' }}>
              Gas, diesel, electric, or hybrid — we support them all
            </Text>
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: Spacing['5xl'] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + Spacing.md,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm }}>Your Vehicle</Text>
            <Text style={{ color: c.text, fontSize: FontSizes['2xl'], fontWeight: '800' }}>
              {activeVehicle?.name || 'Dashboard'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {activeVehicle && (
              <Badge
                text={activeVehicle.type.toUpperCase()}
                color={activeVehicle.type === 'electric' ? Brand.ev : Brand.primary}
              />
            )}
          </View>
        </View>
      </View>

      {/* Vehicle Selector */}
      {vehicles.length > 1 && (
        <VehicleSelector onAddVehicle={() => router.push('/modals/add-vehicle')} />
      )}

      {/* Health Score */}
      <View style={{ padding: Spacing.lg }}>
        <GlassCard style={{ alignItems: 'center', paddingVertical: Spacing['2xl'] }}>
          <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm, fontWeight: '600', marginBottom: Spacing.md }}>
            VEHICLE HEALTH
          </Text>
          <HealthGauge score={healthScore} />
          {activeVehicle && (
            <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: Spacing.md }}>
              {formatDistanceFull(activeVehicle.odometer)} on the clock
            </Text>
          )}
        </GlassCard>
      </View>

      {/* EV Battery Info */}
      {activeVehicle && (activeVehicle.type === 'electric' || activeVehicle.type === 'hybrid') && (
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <Ionicons name="flash" size={24} color={Brand.ev} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                  Battery: {activeVehicle.batteryPercent ?? 0}%
                </Text>
                <View
                  style={{
                    height: 6,
                    backgroundColor: c.border,
                    borderRadius: 3,
                    marginTop: Spacing.xs,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${activeVehicle.batteryPercent ?? 0}%`,
                      backgroundColor: Brand.ev,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
              <Text style={{ color: Brand.ev, fontSize: FontSizes.sm, fontWeight: '600' }}>
                ~{Math.round(((activeVehicle.batteryPercent ?? 0) / 100) * (activeVehicle.fullRangeKm ?? 400))} km
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* Alerts */}
      {upcomingAlerts.length > 0 && (
        <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg }}>
          {upcomingAlerts.slice(0, 2).map((alert) => (
            <AlertBanner
              key={alert.id}
              icon={alert.daysLeft <= 0 ? 'alert-circle' : 'time'}
              color={alert.daysLeft <= 0 ? Brand.danger : Brand.warning}
              text={
                alert.daysLeft <= 0
                  ? `${alert.description} is overdue!`
                  : `${alert.description} due in ${alert.daysLeft} days`
              }
              onPress={() => router.push('/(tabs)/maintenance')}
            />
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl }}>
        <SectionHeader title="Quick Actions" />
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <QuickAction icon="flame" label="Fuel" color={Brand.primary} onPress={() => router.push('/modals/add-fuel')} />
          <QuickAction icon="navigate" label="Trip" color={Brand.accent} onPress={() => router.push('/modals/add-trip')} />
          <QuickAction icon="construct" label="Service" color={Brand.warning} onPress={() => router.push('/modals/add-maintenance')} />
          <QuickAction icon="mic" label="Voice" color={Brand.info} onPress={() => router.push('/modals/voice-logger')} />
          <QuickAction icon="car" label="Solo" color={Brand.gig} onPress={() => router.push('/modals/solo-driver')} />
        </View>
      </View>

      {/* Stats Grid */}
      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl }}>
        <SectionHeader title="Statistics" />
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
          <StatCard
            icon="speedometer"
            label="Avg Consumption"
            value={avgConsumption > 0 ? `${avgConsumption.toFixed(1)}` : '—'}
            subtitle={avgConsumption > 0 ? 'L/100km' : 'No data'}
            color={Brand.primary}
          />
          <StatCard
            icon="cash"
            label="Cost per km"
            value={costPerKm > 0 ? `€${costPerKm.toFixed(2)}` : '—'}
            subtitle={costPerKm > 0 ? 'per kilometer' : 'No data'}
            color={Brand.accent}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <StatCard
            icon="flame"
            label="Total Fuel"
            value={formatCurrency(totalFuelCost)}
            subtitle={`${vehicleFuelLogs.length} fill-ups`}
            color={Brand.warningDark}
          />
          <StatCard
            icon="navigate"
            label="Trips"
            value={`${vehicleTripLogs.length}`}
            subtitle={`${vehicleTripLogs.reduce((s, t) => s + t.distance, 0).toFixed(0)} km total`}
            color={Brand.info}
          />
        </View>
      </View>

      {/* Monthly Spending Chart */}
      {monthlyData.length > 0 && (
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl }}>
          <SectionHeader title="Monthly Spending" />
          <Card>
            <MiniBarChart data={monthlyData} height={110} />
          </Card>
        </View>
      )}

      {/* Recent Activity */}
      <View style={{ paddingHorizontal: Spacing.lg }}>
        <SectionHeader title="Recent Activity" action="See All" onAction={() => router.push('/(tabs)/fuel')} />
        {vehicleFuelLogs.slice(0, 3).map((log) => (
          <Card key={log.id} style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View
                style={{
                  width: 40, height: 40, borderRadius: Radius.md,
                  backgroundColor: Brand.primary + '15',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="flame" size={20} color={Brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                  {log.liters.toFixed(1)}L @ €{log.pricePerLiter.toFixed(3)}
                </Text>
                <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm }}>
                  {log.station || 'Fuel'} · {formatRelativeDate(log.date)}
                </Text>
              </View>
              <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '700' }}>
                {formatCurrency(log.totalCost)}
              </Text>
            </View>
          </Card>
        ))}
        {vehicleFuelLogs.length === 0 && (
          <EmptyState
            icon="flame"
            title="No Fuel Logs Yet"
            subtitle="Add your first fill-up to start tracking your fuel economy"
            actionLabel="Add Fuel Log"
            onAction={() => router.push('/modals/add-fuel')}
          />
        )}
      </View>
    </ScrollView>
  );
}
