import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar } from '@/components/ui/styled-list-screen';

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { serverUrl, logout } = useAuth();

  const aboutQuery = useQuery({ queryKey: ['about'], queryFn: () => api.getAbout() });
  const userQuery = useQuery({ queryKey: ['user'], queryFn: () => api.getCurrentUser() });

  const about = aboutQuery.data?.data;
  const user = userQuery.data?.data;
  const email = user?.attributes?.email || '';
  const initials = email ? email.charAt(0).toUpperCase() : '?';

  const handleLogout = () => {
    Alert.alert('Disconnect', 'Disconnect from this Firefly III server?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <ScreenNavBar title="Settings" />

        {/* User Profile Card */}
        {user ? (
          <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
            <View style={styles.profileOverlay} />
            <View style={styles.profileContent}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.profileEmail}>{email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.roleText}>{(user.attributes?.role || 'User').charAt(0).toUpperCase() + (user.attributes?.role || 'user').slice(1)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Server Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.headerIconBg, { backgroundColor: '#6366F1' + '14' }]}>
              <MaterialIcons name="dns" size={18} color="#6366F1" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Server</Text>
          </View>
          <InfoRow icon="link" label="URL" value={serverUrl || 'Not connected'} colors={colors} />
          {about ? (
            <>
              <InfoRow icon="info-outline" label="Version" value={about.version || 'Unknown'} colors={colors} />
              <InfoRow icon="api" label="API Version" value={about.api_version || 'Unknown'} colors={colors} />
              <InfoRow icon="computer" label="OS" value={about.os || 'Unknown'} colors={colors} />
              <InfoRow icon="storage" label="Driver" value={about.driver || 'Unknown'} colors={colors} />
            </>
          ) : null}
        </View>

        {/* Disconnect */}
        <TouchableOpacity
          style={[styles.disconnectBtn, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={[styles.disconnectText, { color: colors.error }]}>Disconnect from Server</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.muted }]}>Firefly III Mobile Client v1.0.0</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={[infoStyles.row, { borderBottomColor: colors.border }]}>
      <MaterialIcons name={icon as any} size={16} color={colors.muted} style={{ marginRight: 10, marginTop: 1 }} />
      <View style={infoStyles.content}>
        <Text style={[infoStyles.label, { color: colors.muted }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: colors.foreground }]} selectable>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  content: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  profileCard: { marginHorizontal: 16, borderRadius: 22, overflow: 'hidden', marginBottom: 16 },
  profileOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
  profileContent: { padding: 28, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  profileEmail: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  roleText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  infoCard: { marginHorizontal: 16, borderRadius: 18, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 10 },
  headerIconBg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  disconnectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1, gap: 8, marginTop: 8 },
  disconnectText: { fontSize: 15, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 24 },
});
