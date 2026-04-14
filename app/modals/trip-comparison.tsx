/**
 * Trip Cost Comparison Modal — Your cost vs. Uber/Taxi analysis.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import {
  useThemeColors, Card, GlassCard, SectionHeader, EmptyState,
} from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/utils/formatters';
import { calculateCostPerKm, compareTripCost } from '@/utils/calculations';

export default function TripComparisonModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const { vehicleTripLogs, vehicleFuelLogs } = useData();

  const costPerKm = useMemo(() => calculateCostPerKm(vehicleFuelLogs), [vehicleFuelLogs]);

  // If specific trip, show that comparison
  const selectedTrip = tripId ? vehicleTripLogs.find(t => t.id === tripId) : null;

  // Aggregate comparison across all trips
  const aggregate = useMemo(() => {
    if (vehicleTripLogs.length === 0) return null;
    const totalKm = vehicleTripLogs.reduce((s, t) => s + t.distance, 0);
    const comp = compareTripCost(totalKm, costPerKm);
    return { ...comp, totalKm, tripCount: vehicleTripLogs.length };
  }, [vehicleTripLogs, costPerKm]);

  const renderComparison = (distanceKm: number, label: string) => {
    const comp = compareTripCost(distanceKm, costPerKm);

    return (
      <Card style={{ marginBottom: Spacing.lg }}>
        <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm, fontWeight: '600', marginBottom: Spacing.md }}>
          {label} · {distanceKm.toFixed(1)} km
        </Text>

        {/* Comparison Bars */}
        {[
          { label: 'Your Car', cost: comp.own, color: Brand.primary, icon: 'car-sport' as const },
          { label: 'Uber', cost: comp.uber, color: '#000', icon: 'car' as const },
          { label: 'Taxi', cost: comp.taxi, color: Brand.warning, icon: 'car' as const },
        ].map((item) => {
          const maxCost = Math.max(comp.own, comp.uber, comp.taxi);
          const pct = maxCost > 0 ? (item.cost / maxCost) * 100 : 0;
          const isCheapest = item.cost === Math.min(comp.own, comp.uber, comp.taxi);

          return (
            <View key={item.label} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                  <Text style={{ color: c.text, fontSize: FontSizes.sm, fontWeight: '600' }}>
                    {item.label}
                  </Text>
                  {isCheapest && (
                    <View style={{ backgroundColor: Brand.success + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ color: Brand.success, fontSize: 10, fontWeight: '700' }}>CHEAPEST</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: isCheapest ? Brand.primary : c.text, fontSize: FontSizes.md, fontWeight: '700' }}>
                  {formatCurrency(item.cost)}
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: c.border, borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: item.color === '#000' ? c.textSecondary : item.color,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          );
        })}

        {/* Savings Summary */}
        {comp.savings > 0 && (
          <View
            style={{
              backgroundColor: Brand.success + '10',
              borderRadius: Radius.sm,
              padding: Spacing.md,
              alignItems: 'center',
              marginTop: Spacing.sm,
              borderWidth: 1,
              borderColor: Brand.success + '20',
            }}
          >
            <Text style={{ color: Brand.success, fontSize: FontSizes.lg, fontWeight: '800' }}>
              You save {formatCurrency(comp.savings)}
            </Text>
            <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
              compared to the cheapest alternative
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={c.text} />
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Cost Comparison</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Your cost per km */}
        <GlassCard style={{ marginBottom: Spacing.xl, alignItems: 'center' }}>
          <Text style={{ color: c.textSecondary, fontSize: FontSizes.sm }}>YOUR COST PER KILOMETER</Text>
          <Text style={{ color: Brand.primary, fontSize: FontSizes['4xl'], fontWeight: '800', marginTop: Spacing.xs }}>
            €{costPerKm.toFixed(3)}
          </Text>
          <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm }}>
            Based on {vehicleFuelLogs.length} fuel logs
          </Text>
        </GlassCard>

        {/* Specific trip */}
        {selectedTrip && (
          <>
            <SectionHeader title="Selected Trip" />
            {renderComparison(selectedTrip.distance, selectedTrip.purpose || 'Trip')}
          </>
        )}

        {/* Aggregate */}
        {aggregate && (
          <>
            <SectionHeader title="All Trips Combined" />
            {renderComparison(aggregate.totalKm, `${aggregate.tripCount} trips total`)}
          </>
        )}

        {/* Individual trip comparisons */}
        {vehicleTripLogs.length > 0 && !selectedTrip && (
          <>
            <SectionHeader title="Per Trip Breakdown" />
            {vehicleTripLogs.slice(0, 10).map((trip) => (
              <React.Fragment key={trip.id}>
                {renderComparison(trip.distance, trip.purpose || 'Trip')}
              </React.Fragment>
            ))}
          </>
        )}

        {vehicleTripLogs.length === 0 && (
          <EmptyState
            icon="analytics"
            title="No Trip Data"
            subtitle="Log some trips first to see how your costs compare to Uber and taxi"
          />
        )}
      </ScrollView>
    </View>
  );
}
