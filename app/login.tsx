import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function LoginScreen() {
  const [serverUrl, setServerUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const colors = useColors();

  const handleConnect = async () => {
    if (!serverUrl.trim()) {
      setError('Please enter your Firefly III server URL');
      return;
    }
    if (!accessToken.trim()) {
      setError('Please enter your Personal Access Token');
      return;
    }

    let url = serverUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-4">
              <MaterialIcons name="account-balance-wallet" size={40} color="#FFFFFF" />
            </View>
            <Text className="text-3xl font-bold text-foreground">Firefly III</Text>
            <Text className="text-base text-muted mt-1">Connect to your server</Text>
          </View>

          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">Server URL</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-base text-foreground"
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

            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">Personal Access Token</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-base text-foreground"
                placeholder="eyJ0eXAiOiJKV1QiLCJhbGci..."
                placeholderTextColor={colors.muted}
                value={accessToken}
                onChangeText={setAccessToken}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleConnect}
              />
              <Text className="text-xs text-muted mt-1.5">
                Generate a token in Firefly III: Options → Profile → OAuth → Personal Access Tokens
              </Text>
            </View>

            {error ? (
              <View className="bg-error/10 rounded-xl p-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center mt-2"
              onPress={handleConnect}
              disabled={loading}
              style={loading ? { opacity: 0.7 } : undefined}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
