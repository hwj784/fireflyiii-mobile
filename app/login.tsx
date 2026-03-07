import React, { useState } from 'react';
import {
  Text, View, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function LoginScreen() {
  const [serverUrl, setServerUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const colors = useColors();

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

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero gradient area */}
          <View style={[styles.heroArea, { backgroundColor: colors.primary }]}>
            <View style={styles.heroOverlay} />
            <Animated.View entering={FadeInDown.duration(600).delay(100)} className="items-center">
              <View style={styles.logoContainer}>
                <View style={[styles.logoOuter, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <View style={[styles.logoInner, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                    <MaterialIcons name="account-balance-wallet" size={36} color={colors.primary} />
                  </View>
                </View>
              </View>
              <Text style={styles.heroTitle}>Firefly III</Text>
              <Text style={styles.heroSubtitle}>Personal Finance Manager</Text>
            </Animated.View>
          </View>

          {/* Card form area */}
          <View style={[styles.formContainer, { backgroundColor: colors.background }]}>
            <Animated.View
              entering={FadeInDown.duration(600).delay(250)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Connect to Server</Text>
              <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
                Enter your Firefly III server details to get started
              </Text>

              {/* Server URL */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Server URL</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <MaterialIcons name="dns" size={18} color={colors.muted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="https://firefly.example.com"
                    placeholderTextColor={colors.muted}
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Token */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Personal Access Token</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <MaterialIcons name="vpn-key" size={18} color={colors.muted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Paste your token here"
                    placeholderTextColor={colors.muted}
                    value={accessToken}
                    onChangeText={setAccessToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showToken}
                    returnKeyType="done"
                    onSubmitEditing={handleConnect}
                  />
                  <TouchableOpacity onPress={() => setShowToken(!showToken)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name={showToken ? 'visibility-off' : 'visibility'} size={20} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.hintRow}>
                  <MaterialIcons name="info-outline" size={13} color={colors.muted} />
                  <Text style={[styles.hint, { color: colors.muted }]}>
                    Options → Profile → OAuth → Personal Access Tokens
                  </Text>
                </View>
              </View>

              {/* Error */}
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}>
                  <MaterialIcons name="error-outline" size={16} color={colors.error} style={{ marginRight: 8 }} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              ) : null}

              {/* Connect Button */}
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
                onPress={handleConnect}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>Connect</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.muted }]}>
                Firefly III Mobile — Open Source Personal Finance
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroArea: {
    paddingTop: 60,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoOuter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  connectBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
  },
});
