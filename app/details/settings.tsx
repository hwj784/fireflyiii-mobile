import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { serverUrl, logout } = useAuth();

  const aboutQuery = useQuery({
    queryKey: ['about'],
    queryFn: () => api.getAbout(),
  });

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: () => api.getCurrentUser(),
  });

  const about = aboutQuery.data?.data;
  const user = userQuery.data?.data;

  const handleLogout = () => {
    Alert.alert('Disconnect', 'Disconnect from this Firefly III server?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-2">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground flex-1">Settings</Text>
          </View>

          {/* Server Info */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Server</Text>
            <DetailRow label="URL" value={serverUrl || 'Not connected'} />
            {about ? (
              <>
                <DetailRow label="Version" value={about.version || 'Unknown'} />
                <DetailRow label="API Version" value={about.api_version || 'Unknown'} />
                <DetailRow label="OS" value={about.os || 'Unknown'} />
                <DetailRow label="Driver" value={about.driver || 'Unknown'} />
              </>
            ) : null}
          </View>

          {/* User Info */}
          {user ? (
            <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
              <Text className="text-lg font-semibold text-foreground mb-3">User</Text>
              <DetailRow label="Email" value={user.attributes?.email || 'Unknown'} />
              <DetailRow label="Role" value={user.attributes?.role || 'Unknown'} />
              <DetailRow label="Blocked" value={user.attributes?.blocked ? 'Yes' : 'No'} />
            </View>
          ) : null}

          {/* Actions */}
          <TouchableOpacity
            className="bg-error/10 rounded-xl p-4 border border-error/30 items-center mt-4"
            onPress={handleLogout}
          >
            <Text className="text-base font-semibold text-error">Disconnect from Server</Text>
          </TouchableOpacity>

          <Text className="text-xs text-muted text-center mt-6">
            Firefly III Mobile Client
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row py-1.5 border-b border-border/50">
      <Text className="text-sm text-muted w-24">{label}</Text>
      <Text className="text-sm text-foreground flex-1" selectable>{value}</Text>
    </View>
  );
}
