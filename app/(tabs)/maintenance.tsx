/**
 * Maintenance tab — Service history, alerts, scheduled reminders.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import { MaintenanceTypes } from '@/constants/theme';
import {
  useThemeColors, Card, EmptyState, SectionHeader,
  AlertBanner, Badge, StatCard,
} from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { formatCurrency, formatDate, daysUntil, formatDistanceFull } from '@/utils/formatters';

export default function MaintenanceScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeVehicle, vehicleMaintenance, deleteMaintenance } = useData();

  const totalSpent = useMemo(
    () => vehicleMaintenance.reduce((s, m) => s + m.cost, 0),
    [vehicleMaintenance],
  );

  // Separate upcoming/overdue from history
  const { alerts, history } = useMemo(() => {
    const alertList: (typeof vehicleMaintenance[0] & { daysLeft: number })[] = [];
    const historyList: typeof vehicleMaintenance = [];

    vehicleMaintenance.forEach((m) => {
      if (m.nextDueDate) {
        const days = daysUntil(m.nextDueDate);
        if (days <= 60) {
          alertList.push({ ...m, daysLeft: days });
        }
      }
      historyList.push(m);
    });

    alertList.sort((a, b) => a.daysLeft - b.daysLeft);
    historyList.sort((a, b) => b.date.localeCompare(a.date));

    return { alerts: alertList, history: historyList };
  }, [vehicleMaintenance]);

  const getIcon = (type: string) => {
    const mt = MaintenanceTypes.find((t) => t.key === type);
    return mt ? 'construct' : 'construct';
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
        <Text style={{ color: c.text, fontSize: FontSizes['2xl'], fontWeight: '800' }}>
          Service & Maintenance
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          <StatCard
            icon="construct"
            label="Total Spent"
            value={formatCurrency(totalSpent)}
            color={Brand.accent}
          />
          <StatCard
            icon="calendar"
            label="Services"
            value={`${vehicleMaintenance.length}`}
            subtitle="logged"
            color={Brand.primary}
          />
        </View>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <View style={{ marginBottom: Spacing.xl }}>
            <SectionHeader title="Upcoming & Overdue" />
            {alerts.map((alert) => (
              <View key={alert.id} style={{ marginBottom: Spacing.sm }}>
                <AlertBanner
                  icon={alert.daysLeft <= 0 ? 'alert-circle' : 'time'}
                  color={alert.daysLeft <= 0 ? Brand.danger : alert.daysLeft <= 14 ? Brand.warning : Brand.info}
                  text={
                    alert.daysLeft <= 0
                      ? `${alert.description} is overdue by ${Math.abs(alert.daysLeft)} days!`
                      : `${alert.description} due in ${alert.daysLeft} days`
                  }
                  onPress={() => router.push({ pathname: '/modals/add-maintenance', params: { id: alert.id } } as any)}
                />
              </View>
            ))}
          </View>
        )}

        {/* History */}
        <SectionHeader
          title="Service History"
          action="+ Add"
          onAction={() => router.push('/modals/add-maintenance')}
        />

        {history.length === 0 ? (
          <EmptyState
            icon="construct"
            title="No Service Records"
            subtitle="Track your vehicle's maintenance and get smart reminders when service is due"
            actionLabel="Add Service Record"
            onAction={() => router.push('/modals/add-maintenance')}
          />
        ) : (
          history.map((record) => (
            <Card 
              key={record.id} 
              style={{ marginBottom: Spacing.sm }}
              onPress={() => router.push({ pathname: '/modals/add-maintenance', params: { id: record.id } } as any)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View
                  style={{
                    width: 44, height: 44, borderRadius: Radius.md,
                    backgroundColor: Brand.accent + '15',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="construct" size={22} color={Brand.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                    {record.description}
                  </Text>
                  <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm }}>
                    {formatDate(record.date)} · {formatDistanceFull(record.odometer)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
                    <Badge text={record.type.toUpperCase()} color={Brand.accent} />
                    {record.nextDueDate && (
                      <Badge
                        text={`Next: ${formatDate(record.nextDueDate)}`}
                        color={daysUntil(record.nextDueDate) <= 14 ? Brand.warning : Brand.info}
                      />
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '700' }}>
                    {formatCurrency(record.cost)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => deleteMaintenance(record.id)}
                style={{ position: 'absolute', top: 8, right: 8, padding: 4 }}
              >
                <Ionicons name="trash-outline" size={14} color={c.textTertiary} />
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/modals/add-maintenance')}
        style={{
          position: 'absolute',
          bottom: 80 + insets.bottom,
          right: Spacing.lg,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: Brand.accent,
          alignItems: 'center', justifyContent: 'center',
          elevation: 8,
          shadowColor: Brand.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}
