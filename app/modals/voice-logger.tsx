/**
 * Voice Logger Modal — Speak to log fuel, trips, or expenses.
 * Simulates AI voice parsing (no backend required).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useThemeColors, Card, GlassCard, Button, SectionHeader } from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { todayISO } from '@/utils/formatters';
import { startListening, stopListening, addSpeechResultsListener, addSpeechErrorListener } from '@/modules/mlkit-ocr';
import { PermissionsAndroid, Platform } from 'react-native';

type ParsedEntry = {
  type: 'fuel' | 'trip' | 'expense';
  data: Record<string, string | number>;
  text: string;
};

// Simulate AI parsing of voice input
function parseVoiceInput(text: string): ParsedEntry | null {
  const lower = text.toLowerCase();

  // Fuel detection: "filled 40 liters at 1.85 per liter"
  const fuelMatch = lower.match(/(?:filled?|fuel(?:ed)?|pump(?:ed)?)\s+(\d+(?:\.\d+)?)\s*(?:liters?|l)\s*(?:at|@|for)\s*(\d+(?:\.\d+)?)/);
  if (fuelMatch) {
    const liters = parseFloat(fuelMatch[1]);
    const price = parseFloat(fuelMatch[2]);
    return {
      type: 'fuel',
      data: { liters, pricePerLiter: price, totalCost: liters * price },
      text: `⛽ ${liters}L @ €${price.toFixed(3)}/L = €${(liters * price).toFixed(2)}`,
    };
  }

  // Trip detection: "drove 25 km to work"
  const tripMatch = lower.match(/(?:drove|trip|commute(?:d)?|travel(?:led)?)\s+(\d+(?:\.\d+)?)\s*(?:km|kilometers?)\s*(?:to|for)?\s*(.*)?/);
  if (tripMatch) {
    const distance = parseFloat(tripMatch[1]);
    const purpose = tripMatch[2]?.trim() || 'Trip';
    return {
      type: 'trip',
      data: { distance, purpose },
      text: `🗺️ Trip: ${distance} km for ${purpose}`,
    };
  }

  // Expense detection: "paid 45 euros for parking"
  const expenseMatch = lower.match(/(?:paid|spent|cost)\s+(\d+(?:\.\d+)?)\s*(?:euros?|€)?\s*(?:for|on)\s+(.*)/);
  if (expenseMatch) {
    const amount = parseFloat(expenseMatch[1]);
    const desc = expenseMatch[2]?.trim() || 'Expense';
    return {
      type: 'expense',
      data: { amount, description: desc },
      text: `💰 Expense: €${amount.toFixed(2)} for ${desc}`,
    };
  }

  return null;
}

export default function VoiceLoggerModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeVehicle, addFuelLog, addTripLog, addExpense } = useData();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedEntry | null>(null);
  const [saved, setSaved] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Simulate voice recording animation
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  React.useEffect(() => {
    const resSub = addSpeechResultsListener((e) => {
      setTranscript(e.text);
      if (e.isFinal) {
        setIsListening(false);
        stopPulse();
        const result = parseVoiceInput(e.text);
        setParsed(result);
        setSaved(false);
      }
    });

    const errSub = addSpeechErrorListener((e) => {
      console.log('Speech error:', e.error);
      setIsListening(false);
      stopPulse();
      if (e.error !== '7') { // 7 is usually "No speech timeout", which we can silently ignore
        setTranscript('Could not hear you properly.');
      }
    });

    return () => {
      resSub.remove();
      errSub.remove();
    };
  }, []);

  const handleMicPress = async () => {
    if (isListening) {
      setIsListening(false);
      stopPulse();
      stopListening();
    } else {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          alert("Microphone permission required!");
          return;
        }
      }
      setIsListening(true);
      startPulse();
      setParsed(null);
      setSaved(false);
      setTranscript('');
      startListening();
    }
  };

  const handleSimulate = (example: string) => {
    setTranscript(example);
    setIsListening(false);
    stopPulse();
    const result = parseVoiceInput(example);
    setParsed(result);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!activeVehicle || !parsed) return;

    if (parsed.type === 'fuel') {
      await addFuelLog({
        vehicleId: activeVehicle.id,
        date: todayISO(),
        odometer: activeVehicle.odometer,
        liters: parsed.data.liters as number,
        pricePerLiter: parsed.data.pricePerLiter as number,
        totalCost: parsed.data.totalCost as number,
        fullTank: true,
      });
    } else if (parsed.type === 'trip') {
      await addTripLog({
        vehicleId: activeVehicle.id,
        date: todayISO(),
        startOdometer: activeVehicle.odometer,
        endOdometer: activeVehicle.odometer + (parsed.data.distance as number),
        distance: parsed.data.distance as number,
        purpose: parsed.data.purpose as string,
      });
    } else if (parsed.type === 'expense') {
      await addExpense({
        vehicleId: activeVehicle.id,
        date: todayISO(),
        category: 'other',
        amount: parsed.data.amount as number,
        description: parsed.data.description as string,
      });
    }

    setSaved(true);
  };

  const examples = [
    'Filled 42 liters at 1.85 per liter',
    'Drove 35 km to the office',
    'Paid 12 euros for parking',
    'Fueled 50 liters at 1.92 per liter',
    'Trip 120 km for weekend getaway',
    'Spent 85 euros for toll fees',
  ];

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
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Voice Logger</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mic Button */}
        <View style={{ alignItems: 'center', paddingVertical: Spacing['3xl'] }}>
          <Text style={{ color: c.textSecondary, fontSize: FontSizes.md, marginBottom: Spacing.xl, textAlign: 'center' }}>
            {isListening ? 'Listening... speak now' : 'Tap the mic to start'}
          </Text>

          <TouchableOpacity activeOpacity={0.8} onPress={handleMicPress}>
            <Animated.View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: isListening ? Brand.danger + '20' : Brand.accent + '15',
                borderWidth: 3,
                borderColor: isListening ? Brand.danger : Brand.accent,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pulseAnim }],
              }}
            >
              <Ionicons
                name={isListening ? 'stop' : 'mic'}
                size={48}
                color={isListening ? Brand.danger : Brand.accent}
              />
            </Animated.View>
          </TouchableOpacity>

          <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, marginTop: Spacing.lg, textAlign: 'center' }}>
            Say things like "Filled 40 liters at 1.85 per liter"{'\n'}
            or "Drove 25 km to work"
          </Text>
        </View>

        {/* Transcript Display */}
        {transcript && (
          <GlassCard style={{ marginBottom: Spacing.lg }}>
            <Text style={{ color: c.textSecondary, fontSize: FontSizes.xs, fontWeight: '600', marginBottom: Spacing.xs }}>
              TRANSCRIPT
            </Text>
            <Text style={{ color: c.text, fontSize: FontSizes.lg, fontStyle: 'italic' }}>
              "{transcript}"
            </Text>
          </GlassCard>
        )}

        {/* Parsed Result */}
        {parsed && (
          <GlassCard style={{ marginBottom: Spacing.lg, borderColor: Brand.success + '30' }}>
            <Text style={{ color: c.textSecondary, fontSize: FontSizes.xs, fontWeight: '600', marginBottom: Spacing.xs }}>
              AI PARSED
            </Text>
            <Text style={{ color: Brand.primary, fontSize: FontSizes.lg, fontWeight: '600' }}>
              {parsed.text}
            </Text>

            {!saved ? (
              <Button
                title="Save This Entry"
                onPress={handleSave}
                icon="checkmark-circle"
                style={{ marginTop: Spacing.md }}
              />
            ) : (
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                  marginTop: Spacing.md, justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark-circle" size={24} color={Brand.success} />
                <Text style={{ color: Brand.success, fontSize: FontSizes.md, fontWeight: '700' }}>
                  Saved successfully!
                </Text>
              </View>
            )}
          </GlassCard>
        )}

        {transcript && !parsed && (
          <Card style={{ marginBottom: Spacing.lg, borderColor: Brand.warning + '30', borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Ionicons name="warning" size={20} color={Brand.warning} />
              <Text style={{ color: c.text, fontSize: FontSizes.sm }}>
                Couldn't parse that. Try formats like "Filled 40 liters at 1.85 per liter"
              </Text>
            </View>
          </Card>
        )}

        {/* Example Phrases */}
        <SectionHeader title="Try These Examples" />
        <View style={{ gap: Spacing.sm }}>
          {examples.map((ex) => (
            <TouchableOpacity
              key={ex}
              activeOpacity={0.7}
              onPress={() => handleSimulate(ex)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: c.surfaceElevated,
                borderRadius: Radius.md,
                padding: Spacing.md,
                borderWidth: 1,
                borderColor: c.border,
                gap: Spacing.md,
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color={Brand.accent} />
              <Text style={{ color: c.text, fontSize: FontSizes.sm, flex: 1 }}>"{ex}"</Text>
              <Ionicons name="play" size={16} color={Brand.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
