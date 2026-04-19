/**
 * Fuel & Trips tab — Fuel log list, trip log list, comparison button.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import {
  useThemeColors, Card, Button, EmptyState, SectionHeader,
  Badge, StatCard,
} from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import {
  formatCurrency, formatDate, formatDistanceFull,
} from '@/utils/formatters';
import { calculateAvgConsumption, calculateCostPerKm, compareTripCost } from '@/utils/calculations';

type Tab = 'fuel' | 'trips';

function getStationLogo(station?: string): string | null {
  if (!station) return null;
  const s = station.toLowerCase();
  
  const getLogo = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  
  // Greek & European Stations
  if (s.includes('eko')) return getLogo('eko.gr');
  if (s.includes('avin')) return getLogo('avinoil.gr');
  if (s.includes('aegean')) return getLogo('aegeanoil.com');
  if (s.includes('revoil')) return getLogo('revoil.gr');
  if (s.includes('cyclon')) return getLogo('cyclon.gr');
  if (s.includes('bp')) return getLogo('bp.com');
  if (s.includes('shell')) return getLogo('shell.com');
  if (s.includes('total')) return getLogo('totalenergies.com');
  if (s.includes('eni')) return getLogo('eni.com');
  if (s.includes('lukoil')) return getLogo('lukoil.com');
  
  // US & Global
  if (s.includes('esso') || s.includes('exxon')) return getLogo('esso.com');
  if (s.includes('mobil')) return getLogo('exxonmobil.com');
  if (s.includes('texaco')) return getLogo('texaco.com');
  if (s.includes('chevron')) return getLogo('chevron.com');
  if (s.includes('valero')) return getLogo('valero.com');
  if (s.includes('wawa')) return getLogo('wawa.com');
  if (s.includes('costco')) return getLogo('costco.com');
  
  return null;
}

export default function FuelTripsScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    activeVehicle, vehicleFuelLogs, vehicleTripLogs,
    deleteFuelLog, deleteTripLog,
  } = useData();
  const [tab, setTab] = useState<Tab>('fuel');

  const avgConsumption = useMemo(() => calculateAvgConsumption(vehicleFuelLogs), [vehicleFuelLogs]);
  const costPerKm = useMemo(() => calculateCostPerKm(vehicleFuelLogs, activeVehicle?.type), [vehicleFuelLogs, activeVehicle?.type]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
        <Text style={{ color: c.text, fontSize: FontSizes['2xl'], fontWeight: '800' }}>
          Fuel & Trips
        </Text>

        {/* Tab Switcher */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: c.surfaceElevated,
            borderRadius: Radius.md,
            padding: 3,
            marginTop: Spacing.md,
          }}
        >
          {(['fuel', 'trips'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              activeOpacity={0.7}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: Spacing.sm,
                borderRadius: Radius.sm,
                backgroundColor: tab === t ? Brand.primary : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: tab === t ? '#000' : c.textSecondary,
                  fontSize: FontSizes.sm,
                  fontWeight: '700',
                }}
              >
                {t === 'fuel' ? '⛽ Fuel Logs' : '🗺️ Trips'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'fuel' ? (
          <>
            {/* Fuel Stats */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              <StatCard
                icon="speedometer"
                label="Avg L/100km"
                value={avgConsumption > 0 ? avgConsumption.toFixed(1) : '—'}
                color={Brand.primary}
              />
              <StatCard
                icon="cash"
                label="Cost/km"
                value={costPerKm > 0 ? `€${costPerKm.toFixed(2)}` : '—'}
                color={Brand.accent}
              />
            </View>

            <SectionHeader
              title="Fuel Logs"
              action="+ Add"
              onAction={() => router.push('/modals/add-fuel')}
            />

            {vehicleFuelLogs.length === 0 ? (
              <EmptyState
                icon="flame"
                title="No Fuel Logs"
                subtitle="Track your fuel fill-ups to monitor consumption and costs"
                actionLabel="Add First Log"
                onAction={() => router.push('/modals/add-fuel')}
              />
            ) : (
              vehicleFuelLogs
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((log) => (
                  <Card 
                    key={log.id} 
                    style={{ marginBottom: Spacing.sm }}
                    onPress={() => router.push({ pathname: '/modals/add-fuel', params: { id: log.id } } as any)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                      <View
                        style={{
                          width: 44, height: 44, borderRadius: Radius.md,
                          backgroundColor: Brand.primary + '15',
                          alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {getStationLogo(log.station) ? (
                          <Image
                            source={{ uri: getStationLogo(log.station) as string }}
                            style={{ width: 44, height: 44, resizeMode: 'cover' }}
                          />
                        ) : (
                          <Ionicons name="flame" size={22} color={Brand.primary} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                          <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                            {log.liters.toFixed(1)}L
                          </Text>
                          {log.fullTank && <Badge text="FULL" color={Brand.success} />}
                        </View>
                        <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm }}>
                          {log.station || 'Fill-up'} · {formatDate(log.date)}
                        </Text>
                        <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                          {formatDistanceFull(log.odometer)} · €{log.pricePerLiter.toFixed(3)}/L
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>
                          {formatCurrency(log.totalCost)}
                        </Text>
                        {log.distance && log.distance > 0 && (
                          <Text style={{ color: Brand.primary, fontSize: FontSizes.xs }}>
                            {((log.liters / log.distance) * 100).toFixed(1)} L/100km
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteFuelLog(log.id)}
                      style={{ position: 'absolute', top: 8, right: 8, padding: 4 }}
                    >
                      <Ionicons name="trash-outline" size={14} color={c.textTertiary} />
                    </TouchableOpacity>
                  </Card>
                ))
            )}
          </>
        ) : (
          <>
            {/* Trips Stats */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              <StatCard
                icon="navigate"
                label="Total Trips"
                value={`${vehicleTripLogs.length}`}
                color={Brand.accent}
              />
              <StatCard
                icon="map"
                label="Total Distance"
                value={`${vehicleTripLogs.reduce((s, t) => s + (t.distance || 0), 0).toFixed(0)} km`}
                color={Brand.info}
              />
            </View>

            <SectionHeader
              title="Trip Logs"
              action="+ Add"
              onAction={() => router.push('/modals/add-trip')}
            />

            {vehicleTripLogs.length === 0 ? (
              <EmptyState
                icon="navigate"
                title="No Trips Logged"
                subtitle="Log your trips and compare costs against Uber and taxi"
                actionLabel="Log a Trip"
                onAction={() => router.push('/modals/add-trip')}
              />
            ) : (
              vehicleTripLogs
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((trip) => {
                  const comp = compareTripCost(trip.distance || 0, costPerKm);
                  const displayCost = trip.costEstimate || comp.own;
                  const displayUber = trip.uberComparison || comp.uber;

                  return (
                    <Card
                      key={trip.id}
                      style={{ marginBottom: Spacing.sm }}
                      onPress={() =>
                        router.push({
                          pathname: '/modals/add-trip',
                          params: { id: trip.id },
                        } as any)
                      }
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                        <View
                          style={{
                            width: 44, height: 44, borderRadius: Radius.md,
                            backgroundColor: Brand.accent + '15',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Ionicons name="navigate" size={22} color={Brand.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                            {trip.purpose || 'Trip'} {trip.route && trip.route.length > 0 && '🗺️'}
                          </Text>
                          <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm }}>
                            {(trip.distance || 0).toFixed(1)} km · {formatDate(trip.date)}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          {displayCost !== null && (
                            <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '700' }}>
                              {formatCurrency(displayCost)}
                            </Text>
                          )}
                          {displayUber !== null && displayCost !== null && (
                            <Badge
                              text={`Save ${formatCurrency(displayUber - displayCost)}`}
                              color={Brand.success}
                            />
                          )}
                          <Ionicons name="chevron-forward" size={14} color={c.textTertiary} />
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteTripLog(trip.id)}
                      style={{ position: 'absolute', top: 8, right: 8, padding: 4 }}
                    >
                      <Ionicons name="trash-outline" size={14} color={c.textTertiary} />
                    </TouchableOpacity>
                  </Card>
                  );
                })
            )}

            {vehicleTripLogs.length > 0 && (
              <Button
                title="Compare Trip Costs"
                onPress={() => router.push('/modals/trip-comparison')}
                variant="outline"
                icon="analytics"
                style={{ marginTop: Spacing.md }}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push(tab === 'fuel' ? '/modals/add-fuel' : '/modals/add-trip')
        }
        style={{
          position: 'absolute',
          bottom: 80 + insets.bottom,
          right: Spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Brand.primary,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 8,
          shadowColor: Brand.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
}
