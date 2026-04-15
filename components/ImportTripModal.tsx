/**
 * Modal that appears when a pending background trip is detected.
 * Shows trip distance/duration and lets the user import or dismiss it.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useThemeColors } from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  getPendingTrip, clearPendingTrip, type PendingTrip,
} from '@/utils/driving-detector';
import { todayISO } from '@/utils/formatters';

export function ImportTripModal() {
  const c = useThemeColors();
  const { activeVehicle, updateVehicle, addTripLog } = useData();
  const { distanceLabel, formatDistanceValue } = useSettings();

  const [visible, setVisible] = useState(false);
  const [trip, setTrip] = useState<PendingTrip | null>(null);
  const [importing, setImporting] = useState(false);

  // Check for pending trip on mount
  useEffect(() => {
    (async () => {
      const pending = await getPendingTrip();
      if (pending && pending.distanceKm >= 0.5) {
        setTrip(pending);
        setVisible(true);
      }
    })();
  }, []);

  const handleImport = async () => {
    if (!trip || !activeVehicle) return;
    setImporting(true);

    try {
      const distance = Math.round(trip.distanceKm * 10) / 10;
      const startOdo = activeVehicle.odometer;
      const endOdo = startOdo + distance;

      // Add as trip log
      await addTripLog({
        vehicleId: activeVehicle.id,
        date: todayISO(),
        startOdometer: startOdo,
        endOdometer: endOdo,
        distance,
        purpose: 'Auto-detected drive',
        duration: Math.round(
          (new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / 60000,
        ),
      });

      // Update vehicle odometer
      await updateVehicle(activeVehicle.id, { odometer: endOdo });

      // Clear pending trip
      await clearPendingTrip();
      setVisible(false);
    } catch (e) {
      console.error('Error importing trip:', e);
    } finally {
      setImporting(false);
    }
  };

  const handleDismiss = async () => {
    await clearPendingTrip();
    setVisible(false);
  };

  if (!trip) return null;

  const distKm = trip.distanceKm;
  const displayDist = formatDistanceValue(distKm);
  const durationMin = Math.round(
    (new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / 60000,
  );
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: Radius.xl,
            borderTopRightRadius: Radius.xl,
            padding: Spacing.xl,
            paddingBottom: Spacing['3xl'],
          }}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: c.border,
                borderRadius: 2,
                marginBottom: Spacing.lg,
              }}
            />
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: Brand.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.md,
              }}
            >
              <Ionicons name="navigate" size={32} color={Brand.primary} />
            </View>
            <Text
              style={{
                color: c.text,
                fontSize: FontSizes.xl,
                fontWeight: '800',
              }}
            >
              Drive Detected!
            </Text>
            <Text
              style={{
                color: c.textSecondary,
                fontSize: FontSizes.sm,
                textAlign: 'center',
                marginTop: Spacing.xs,
              }}
            >
              We tracked a trip in the background.{'\n'}Would you like to add it to your log?
            </Text>
          </View>

          {/* Trip Stats */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: c.surfaceElevated,
              borderRadius: Radius.lg,
              padding: Spacing.lg,
              marginBottom: Spacing.xl,
              gap: Spacing.lg,
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Ionicons name="speedometer" size={22} color={Brand.primary} />
              <Text
                style={{
                  color: c.text,
                  fontSize: FontSizes.xl,
                  fontWeight: '800',
                  marginTop: Spacing.xs,
                }}
              >
                {displayDist.toFixed(1)}
              </Text>
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                {distanceLabel}
              </Text>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: c.border,
              }}
            />

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Ionicons name="time" size={22} color={Brand.accent} />
              <Text
                style={{
                  color: c.text,
                  fontSize: FontSizes.xl,
                  fontWeight: '800',
                  marginTop: Spacing.xs,
                }}
              >
                {durationStr}
              </Text>
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                duration
              </Text>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: c.border,
              }}
            />

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Ionicons name="car" size={22} color={Brand.info} />
              <Text
                style={{
                  color: c.text,
                  fontSize: FontSizes.xl,
                  fontWeight: '800',
                  marginTop: Spacing.xs,
                }}
              >
                {trip.points.length}
              </Text>
              <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                GPS points
              </Text>
            </View>
          </View>

          {/* Vehicle Info */}
          {activeVehicle && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: c.surfaceElevated,
                borderRadius: Radius.md,
                padding: Spacing.md,
                marginBottom: Spacing.xl,
                gap: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: activeVehicle.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={activeVehicle.type === 'electric' ? 'flash' : 'car-sport'}
                  size={18}
                  color="#FFF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: FontSizes.sm, fontWeight: '600' }}>
                  {activeVehicle.name}
                </Text>
                <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                  Odometer: {activeVehicle.odometer.toLocaleString()} → {(activeVehicle.odometer + Math.round(distKm)).toLocaleString()} {distanceLabel}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={{ gap: Spacing.sm }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleImport}
              disabled={importing}
              style={{
                height: 52,
                borderRadius: Radius.lg,
                backgroundColor: Brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: Spacing.sm,
              }}
            >
              {importing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#000" />
                  <Text
                    style={{
                      color: '#000',
                      fontSize: FontSizes.md,
                      fontWeight: '700',
                    }}
                  >
                    Import Trip
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDismiss}
              style={{
                height: 48,
                borderRadius: Radius.lg,
                backgroundColor: c.surfaceElevated,
                borderWidth: 1,
                borderColor: c.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: FontSizes.md,
                  fontWeight: '600',
                }}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
