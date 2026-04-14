/**
 * Solo Driver Mode — Gig worker session tracking.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import {
  useThemeColors, Card, GlassCard, Button, Input,
  SectionHeader, StatCard, EmptyState, Badge, Divider,
} from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { formatCurrency, formatDuration, formatDate, todayISO } from '@/utils/formatters';

const platforms = ['Uber', 'Bolt', 'Lyft', 'DoorDash', 'Deliveroo', 'Other'];

export default function SoloDriverModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    activeVehicle, vehicleSoloSessions, addSoloSession, updateSoloSession,
  } = useData();

  const [isActive, setIsActive] = useState(false);
  const [platform, setPlatform] = useState('Uber');
  const [startOdo, setStartOdo] = useState(activeVehicle?.odometer.toString() || '');
  const [endOdo, setEndOdo] = useState('');
  const [earnings, setEarnings] = useState('');
  const [trips, setTrips] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Active session timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsedMinutes((p) => p + 1);
      }, 60000); // every minute
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
    setSessionStart(new Date().toISOString());
    setElapsedMinutes(0);
  };

  const handleEnd = async () => {
    if (!activeVehicle) return;

    const parsedEarnings = parseFloat(earnings) || 0;
    const parsedFuel = parseFloat(fuelCost) || 0;
    const parsedTrips = parseInt(trips) || 0;

    await addSoloSession({
      vehicleId: activeVehicle.id,
      startTime: sessionStart || new Date().toISOString(),
      endTime: new Date().toISOString(),
      startOdometer: parseInt(startOdo) || 0,
      endOdometer: parseInt(endOdo) || 0,
      trips: parsedTrips,
      earnings: parsedEarnings,
      fuelCost: parsedFuel,
      platform,
    });

    setIsActive(false);
    setEndOdo('');
    setEarnings('');
    setTrips('');
    setFuelCost('');
    setElapsedMinutes(0);
    Alert.alert('Session Saved', 'Your driving session has been logged!');
  };

  // Session stats
  const totalEarnings = vehicleSoloSessions.reduce((s, sess) => s + sess.earnings, 0);
  const totalFuelCost = vehicleSoloSessions.reduce((s, sess) => s + sess.fuelCost, 0);
  const totalTrips = vehicleSoloSessions.reduce((s, sess) => s + sess.trips, 0);
  const totalProfit = totalEarnings - totalFuelCost;

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Ionicons name="car" size={20} color={Brand.gig} />
          <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Solo Driver</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Session Banner */}
        {isActive && (
          <GlassCard
            style={{
              marginBottom: Spacing.xl,
              borderColor: Brand.gig + '50',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: Brand.danger,
                marginBottom: Spacing.sm,
              }}
            />
            <Text style={{ color: Brand.gig, fontSize: FontSizes.sm, fontWeight: '700' }}>
              SESSION ACTIVE
            </Text>
            <Text style={{ color: c.text, fontSize: FontSizes['4xl'], fontWeight: '800', marginTop: Spacing.xs }}>
              {formatDuration(elapsedMinutes)}
            </Text>
            <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm }}>
              {platform} · Started {new Date(sessionStart || '').toLocaleTimeString()}
            </Text>
          </GlassCard>
        )}

        {/* Platform Selector */}
        {!isActive && (
          <>
            <SectionHeader title="Platform" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl }}>
              {platforms.map((p) => (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.7}
                  onPress={() => setPlatform(p)}
                  style={{
                    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                    borderRadius: Radius.full,
                    backgroundColor: platform === p ? Brand.gig + '20' : c.surfaceElevated,
                    borderWidth: 1,
                    borderColor: platform === p ? Brand.gig : c.border,
                  }}
                >
                  <Text
                    style={{
                      color: platform === p ? Brand.gig : c.textSecondary,
                      fontSize: FontSizes.sm, fontWeight: '600',
                    }}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Session Controls */}
        {!isActive ? (
          <>
            <Input
              label="Starting Odometer"
              value={startOdo}
              onChangeText={setStartOdo}
              keyboardType="number-pad"
              suffix="km"
            />
            <Button
              title="Start Session"
              onPress={handleStart}
              size="lg"
              icon="play"
              style={{ backgroundColor: Brand.gig }}
            />
          </>
        ) : (
          <>
            <Input label="End Odometer" value={endOdo} onChangeText={setEndOdo} keyboardType="number-pad" suffix="km" />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Input label="Earnings" value={earnings} onChangeText={setEarnings} keyboardType="decimal-pad" suffix="€" containerStyle={{ flex: 1 }} />
              <Input label="Fuel Cost" value={fuelCost} onChangeText={setFuelCost} keyboardType="decimal-pad" suffix="€" containerStyle={{ flex: 1 }} />
            </View>
            <Input label="Number of Trips" value={trips} onChangeText={setTrips} keyboardType="number-pad" />
            <Button
              title="End Session"
              onPress={handleEnd}
              size="lg"
              variant="danger"
              icon="stop"
            />
          </>
        )}

        {/* Lifetime Stats */}
        {vehicleSoloSessions.length > 0 && (
          <View style={{ marginTop: Spacing['2xl'] }}>
            <SectionHeader title="Lifetime Stats" />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <StatCard icon="cash" label="Earnings" value={formatCurrency(totalEarnings)} color={Brand.gig} />
              <StatCard icon="trending-up" label="Profit" value={formatCurrency(totalProfit)} color={totalProfit >= 0 ? Brand.success : Brand.danger} />
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <StatCard icon="flame" label="Fuel Cost" value={formatCurrency(totalFuelCost)} color={Brand.warningDark} />
              <StatCard icon="car" label="Total Rides" value={`${totalTrips}`} color={Brand.info} />
            </View>
          </View>
        )}

        {/* Session History */}
        <View style={{ marginTop: Spacing.xl }}>
          <SectionHeader title="Recent Sessions" />
          {vehicleSoloSessions.length === 0 ? (
            <EmptyState
              icon="car"
              title="No Sessions Yet"
              subtitle="Start your first driving session to track your gig earnings"
            />
          ) : (
            vehicleSoloSessions.slice(0, 10).map((sess) => {
              const profit = sess.earnings - sess.fuelCost;
              const distance = sess.endOdometer ? sess.endOdometer - sess.startOdometer : 0;
              return (
                <Card key={sess.id} style={{ marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                    <View
                      style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: Brand.gig + '15',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="car" size={20} color={Brand.gig} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                        {sess.platform} · {sess.trips} rides
                      </Text>
                      <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                        {formatDate(sess.startTime)} · {distance > 0 ? `${distance} km` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: profit >= 0 ? Brand.success : Brand.danger, fontSize: FontSizes.md, fontWeight: '700' }}>
                        {formatCurrency(profit)}
                      </Text>
                      <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                        earned {formatCurrency(sess.earnings)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
