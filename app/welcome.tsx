/**
 * Welcome / Auth screen — Loading splash → Login options.
 * First screen users see. Animated splash transitions into login form.
 * Ready for Supabase integration (email/password + Google OAuth).
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Animated,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { continueAsGuest, signInWithEmail, signUpWithEmail, signInWithGoogle, status } = useAuth();

  const [showLogin, setShowLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // login vs signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const splashProgress = useRef(new Animated.Value(0)).current;

  // Dark theme colors (auth screen always uses dark)
  const c = Colors.dark;

  useEffect(() => {
    // Splash animation sequence
    Animated.sequence([
      // Logo appears
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Loading bar
      Animated.timing(splashProgress, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
      // Title fades in
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Content appears
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = async () => {
    setLoading(true);
    await continueAsGuest();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const progressWidth = splashProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
        {/* ── Logo & Brand ────────────────────────────── */}
        <Animated.View
          style={{
            alignItems: 'center',
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
            marginBottom: Spacing['2xl'],
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 30,
              backgroundColor: Brand.primary + '15',
              borderWidth: 2,
              borderColor: Brand.primary + '30',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.lg,
            }}
          >
            <Ionicons name="car-sport" size={50} color={Brand.primary} />
          </View>
          <Text
            style={{
              color: c.text,
              fontSize: FontSizes['4xl'],
              fontWeight: '900',
              letterSpacing: 1,
            }}
          >
            Vehiclo
          </Text>
        </Animated.View>

        {/* ── Loading Bar (splash) ────────────────────── */}
        <View
          style={{
            width: 200,
            height: 3,
            backgroundColor: c.border,
            borderRadius: 2,
            overflow: 'hidden',
            marginBottom: Spacing['2xl'],
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              width: progressWidth,
              backgroundColor: Brand.primary,
              borderRadius: 2,
            }}
          />
        </View>

        {/* ── Tagline ─────────────────────────────────── */}
        <Animated.View style={{ opacity: titleOpacity, marginBottom: Spacing['3xl'] }}>
          <Text
            style={{
              color: c.textSecondary,
              fontSize: FontSizes.md,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            AI-powered vehicle management{'\n'}for smart drivers
          </Text>
        </Animated.View>

        {/* ── Auth Buttons ────────────────────────────── */}
        <Animated.View style={{ opacity: contentOpacity, width: '100%', maxWidth: 360 }}>
          {!showLogin ? (
            // ── Main Options ──
            <View style={{ gap: Spacing.md }}>
              {/* Continue as Guest */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleGuestContinue}
                disabled={loading}
                style={{
                  height: 56,
                  borderRadius: Radius.lg,
                  backgroundColor: Brand.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: Spacing.sm,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="arrow-forward" size={20} color="#000" />
                    <Text style={{ color: '#000', fontSize: FontSizes.lg, fontWeight: '700' }}>
                      Continue as Guest
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: Spacing.xs,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
                <Text style={{ color: c.textTertiary, fontSize: FontSizes.sm, paddingHorizontal: Spacing.md }}>
                  or sign in
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
              </View>

              {/* Google Sign In */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleGoogleSignIn}
                style={{
                  height: 52,
                  borderRadius: Radius.lg,
                  backgroundColor: '#FFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: Spacing.sm,
                }}
              >
                <Text style={{ fontSize: 20 }}>G</Text>
                <Text style={{ color: '#333', fontSize: FontSizes.md, fontWeight: '600' }}>
                  Continue with Google
                </Text>
              </TouchableOpacity>

              {/* Email Sign In */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowLogin(true)}
                style={{
                  height: 52,
                  borderRadius: Radius.lg,
                  backgroundColor: c.surfaceElevated,
                  borderWidth: 1,
                  borderColor: c.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: Spacing.sm,
                }}
              >
                <Ionicons name="mail" size={20} color={c.text} />
                <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                  Sign in with Email
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // ── Email Login Form ──
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                <TouchableOpacity onPress={() => { setShowLogin(false); setError(''); }}>
                  <Ionicons name="arrow-back" size={24} color={c.text} />
                </TouchableOpacity>
                <Text style={{ color: c.text, fontSize: FontSizes.xl, fontWeight: '700', marginLeft: Spacing.md }}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              </View>

              {error ? (
                <View
                  style={{
                    backgroundColor: Brand.danger + '15',
                    borderRadius: Radius.sm,
                    padding: Spacing.md,
                    borderWidth: 1,
                    borderColor: Brand.danger + '30',
                  }}
                >
                  <Text style={{ color: Brand.danger, fontSize: FontSizes.sm }}>{error}</Text>
                </View>
              ) : null}

              <View
                style={{
                  backgroundColor: c.surfaceElevated,
                  borderRadius: Radius.md,
                  borderWidth: 1,
                  borderColor: c.border,
                  paddingHorizontal: Spacing.md,
                  height: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="mail" size={18} color={c.textTertiary} style={{ marginRight: Spacing.sm }} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={c.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ flex: 1, color: c.text, fontSize: FontSizes.md }}
                />
              </View>

              <View
                style={{
                  backgroundColor: c.surfaceElevated,
                  borderRadius: Radius.md,
                  borderWidth: 1,
                  borderColor: c.border,
                  paddingHorizontal: Spacing.md,
                  height: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="lock-closed" size={18} color={c.textTertiary} style={{ marginRight: Spacing.sm }} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={c.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={{ flex: 1, color: c.text, fontSize: FontSizes.md }}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleEmailAuth}
                disabled={loading}
                style={{
                  height: 52,
                  borderRadius: Radius.lg,
                  backgroundColor: Brand.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={{ color: '#000', fontSize: FontSizes.md, fontWeight: '700' }}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setIsLogin(!isLogin); setError(''); }}
                style={{ alignItems: 'center', paddingVertical: Spacing.sm }}
              >
                <Text style={{ color: Brand.primary, fontSize: FontSizes.sm }}>
                  {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Terms text */}
          <Text
            style={{
              color: c.textTertiary,
              fontSize: FontSizes.xs,
              textAlign: 'center',
              marginTop: Spacing['2xl'],
              lineHeight: 16,
            }}
          >
            By continuing, you agree to the{'\n'}Terms of Service & Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
