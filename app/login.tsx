import React, { useState, useRef } from 'react';
import {
  Text, View, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet, useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { FireflyLogo } from '@/components/firefly-logo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// Firefly III brand colors
const FIREFLY = {
  primary: '#CD5029',
  primaryLight: '#DF7351',
  primaryDark: '#A33614',
  gradientStart: '#FFA284',
  gradientEnd: '#A33614',
  teal: '#1E6581',
};

export default function LoginScreen() {
  const [serverUrl, setServerUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const tokenInputRef = useRef<TextInput>(null);

  const handleConnect = async () => {
    if (!serverUrl.trim()) { setError('Please enter your Firefly III server URL'); return; }
    if (!accessToken.trim()) { setError('Please enter your Personal Access Token'); return; }

    let url = serverUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    url = url.replace(/\/+$/, '');

    setLoading(true);
    setError('');
    try {
      await login(url, accessToken.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Connection failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Adaptive colors for the form card
  const cardBg = isDark ? '#1C1917' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(205,80,41,0.15)' : 'rgba(205,80,41,0.08)';
  const inputBg = isDark ? '#292524' : '#FFF7F5';
  const inputBorder = isDark ? 'rgba(205,80,41,0.20)' : 'rgba(205,80,41,0.12)';
  const inputBorderFocused = isDark ? 'rgba(205,80,41,0.50)' : 'rgba(205,80,41,0.35)';
  const textPrimary = isDark ? '#FAFAF9' : '#1C1917';
  const textSecondary = isDark ? '#A8A29E' : '#78716C';
  const textMuted = isDark ? '#78716C' : '#A8A29E';
  const pageBg = isDark ? '#0C0A09' : '#FFFBFA';
  const errorBg = isDark ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.06)';
  const errorBorder = isDark ? 'rgba(220,38,38,0.30)' : 'rgba(220,38,38,0.15)';

  // Focus state for inputs
  const [urlFocused, setUrlFocused] = useState(false);
  const [tokenFocused, setTokenFocused] = useState(false);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: pageBg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section with logo */}
          <Animated.View entering={FadeIn.duration(800)} style={styles.heroSection}>
            {/* Background glow effect */}
            <View style={[styles.heroGlow, { backgroundColor: isDark ? 'rgba(205,80,41,0.06)' : 'rgba(205,80,41,0.04)' }]} />

            <Animated.View entering={FadeInDown.duration(700).delay(100)} style={styles.logoWrapper}>
              <FireflyLogo size={100} variant="gradient" />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(700).delay(250)} style={styles.titleBlock}>
              <Text style={[styles.appTitle, { color: textPrimary }]}>
                Firefly III
              </Text>
              <Text style={[styles.appSubtitle, { color: textSecondary }]}>
                Personal Finance Manager
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Form card */}
          <Animated.View
            entering={FadeInDown.duration(700).delay(400)}
            style={[styles.formCard, {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              shadowColor: isDark ? '#000' : FIREFLY.primary,
              shadowOpacity: isDark ? 0.3 : 0.06,
            }]}
          >
            <Text style={[styles.formTitle, { color: textPrimary }]}>
              Connect to Server
            </Text>
            <Text style={[styles.formSubtitle, { color: textSecondary }]}>
              Enter your self-hosted Firefly III server details
            </Text>

            {/* Server URL field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Server URL</Text>
              <View style={[
                styles.inputContainer,
                {
                  backgroundColor: inputBg,
                  borderColor: urlFocused ? inputBorderFocused : inputBorder,
                },
              ]}>
                <View style={[styles.inputIcon, { backgroundColor: isDark ? 'rgba(205,80,41,0.12)' : 'rgba(205,80,41,0.08)' }]}>
                  <MaterialIcons name="dns" size={16} color={FIREFLY.primary} />
                </View>
                <TextInput
                  style={[styles.textInput, { color: textPrimary }]}
                  placeholder="https://firefly.example.com"
                  placeholderTextColor={textMuted}
                  value={serverUrl}
                  onChangeText={(text) => { setServerUrl(text); if (error) setError(''); }}
                  onFocus={() => setUrlFocused(true)}
                  onBlur={() => setUrlFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="next"
                  onSubmitEditing={() => tokenInputRef.current?.focus()}
                />
              </View>
            </View>

            {/* Personal Access Token field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Personal Access Token</Text>
              <View style={[
                styles.inputContainer,
                {
                  backgroundColor: inputBg,
                  borderColor: tokenFocused ? inputBorderFocused : inputBorder,
                },
              ]}>
                <View style={[styles.inputIcon, { backgroundColor: isDark ? 'rgba(205,80,41,0.12)' : 'rgba(205,80,41,0.08)' }]}>
                  <MaterialIcons name="vpn-key" size={16} color={FIREFLY.primary} />
                </View>
                <TextInput
                  ref={tokenInputRef}
                  style={[styles.textInput, { color: textPrimary }]}
                  placeholder="Paste your token here"
                  placeholderTextColor={textMuted}
                  value={accessToken}
                  onChangeText={(text) => { setAccessToken(text); if (error) setError(''); }}
                  onFocus={() => setTokenFocused(true)}
                  onBlur={() => setTokenFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showToken}
                  returnKeyType="done"
                  onSubmitEditing={handleConnect}
                />
                <TouchableOpacity
                  onPress={() => setShowToken(!showToken)}
                  style={styles.visibilityBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name={showToken ? 'visibility-off' : 'visibility'}
                    size={18}
                    color={textMuted}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.hintRow}>
                <MaterialIcons name="info-outline" size={12} color={textMuted} />
                <Text style={[styles.hintText, { color: textMuted }]}>
                  Options → Profile → OAuth → Personal Access Tokens
                </Text>
              </View>
            </View>

            {/* Error display */}
            {error ? (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={[styles.errorContainer, { backgroundColor: errorBg, borderColor: errorBorder }]}
              >
                <MaterialIcons name="error-outline" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Connect button */}
            <TouchableOpacity
              style={[
                styles.connectButton,
                loading && styles.connectButtonLoading,
              ]}
              onPress={handleConnect}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Connect</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.duration(600).delay(600)} style={styles.footer}>
            <View style={styles.footerDivider}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(205,80,41,0.10)' : 'rgba(205,80,41,0.08)' }]} />
              <FireflyLogo size={20} variant="solid" color={textMuted} />
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(205,80,41,0.10)' : 'rgba(205,80,41,0.08)' }]} />
            </View>
            <Text style={[styles.footerText, { color: textMuted }]}>
              Open Source Personal Finance
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    alignSelf: 'center',
  },
  logoWrapper: {
    marginBottom: 20,
  },
  titleBlock: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  formCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
    elevation: 10,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingRight: 14,
    overflow: 'hidden',
  },
  inputIcon: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
    paddingLeft: 4,
  },
  visibilityBtn: {
    padding: 4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
    paddingLeft: 4,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    color: '#DC2626',
  },
  connectButton: {
    backgroundColor: FIREFLY.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: FIREFLY.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  connectButtonLoading: {
    opacity: 0.75,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 40,
  },
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
