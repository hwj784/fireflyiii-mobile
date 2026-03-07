import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, EmptyState } from '@/components/ui/styled-list-screen';

export default function RulesScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['rules'], queryFn: () => api.getRules(1) });
  const rules = query.data?.data || [];

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Rule', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteRule(id); queryClient.invalidateQueries({ queryKey: ['rules'] }); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleFireRule = async (id: string) => {
    try {
      await api.fireRule(id);
      Alert.alert('Success', 'Rule executed successfully');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <ScreenContainer>
      <FlatList
        data={rules}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ScreenNavBar title="Rules" />}
        renderItem={({ item }) => {
          const attr = item.attributes;
          const triggers = attr.triggers || [];
          const actions = attr.actions || [];
          const isActive = attr.active !== false;

          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.headerRow}>
                <View style={[styles.iconBg, { backgroundColor: (isActive ? '#6366F1' : colors.muted) + '14' }]}>
                  <MaterialIcons name="rule" size={20} color={isActive ? '#6366F1' : colors.muted} />
                </View>
                <View style={styles.titleCol}>
                  <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{attr.title}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.statusBadge, { backgroundColor: (isActive ? colors.success : colors.muted) + '18' }]}>
                      <View style={[styles.statusDot, { backgroundColor: isActive ? colors.success : colors.muted }]} />
                      <Text style={[styles.statusText, { color: isActive ? colors.success : colors.muted }]}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    <Text style={[styles.countText, { color: colors.muted }]}>
                      {triggers.length} trigger{triggers.length !== 1 ? 's' : ''} · {actions.length} action{actions.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleFireRule(item.id)} style={[styles.playBtn, { backgroundColor: colors.success + '14' }]}>
                    <MaterialIcons name="play-arrow" size={20} color={colors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, attr.title)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {triggers.length > 0 ? (
                <View style={[styles.triggersSection, { borderTopColor: colors.border }]}>
                  {triggers.slice(0, 3).map((t: any, i: number) => (
                    <View key={i} style={styles.triggerRow}>
                      <View style={[styles.triggerDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.triggerText, { color: colors.foreground }]} numberOfLines={1}>
                        <Text style={{ color: colors.muted }}>{t.type}: </Text>{t.value}
                      </Text>
                    </View>
                  ))}
                  {triggers.length > 3 ? (
                    <Text style={[styles.moreText, { color: colors.muted }]}>+{triggers.length - 3} more triggers</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          <EmptyState icon="rule" title="No rules" subtitle="Rules automate transaction processing" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 10, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBg: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  titleCol: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  countText: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  playBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtn: { padding: 4 },
  triggersSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
  triggerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  triggerDot: { width: 4, height: 4, borderRadius: 2 },
  triggerText: { fontSize: 12, flex: 1 },
  moreText: { fontSize: 11, marginTop: 4, marginLeft: 12 },
});
