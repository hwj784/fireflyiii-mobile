import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, EmptyState, FloatingActionButton } from '@/components/ui/styled-list-screen';

export default function PiggyBanksScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['piggy-banks'], queryFn: () => api.getPiggyBanks(1) });
  const piggyBanks = query.data?.data || [];

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Piggy Bank', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deletePiggyBank(id); queryClient.invalidateQueries({ queryKey: ['piggy-banks'] }); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  return (
    <ScreenContainer>
      <FlatList
        data={piggyBanks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ScreenNavBar title="Piggy Banks" />}
        renderItem={({ item }) => {
          const attr = item.attributes;
          const current = parseFloat(attr.current_amount || '0');
          const target = parseFloat(attr.target_amount || '0');
          const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          const barColor = percentage >= 100 ? colors.success : percentage > 60 ? colors.primary : colors.warning;

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/details/piggy-bank/${item.id}` as any)}
              activeOpacity={0.6}
            >
              <View style={styles.headerRow}>
                <View style={[styles.iconBg, { backgroundColor: '#10B981' + '14' }]}>
                  <MaterialIcons name="savings" size={20} color="#10B981" />
                </View>
                <View style={styles.titleCol}>
                  <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{attr.name}</Text>
                  <Text style={[styles.meta, { color: colors.muted }]}>{attr.account_name}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => router.push(`/modals/piggy-form?id=${item.id}` as any)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="edit" size={18} color={colors.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, attr.name)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressSection}>
                <View style={styles.amountRow}>
                  <Text style={[styles.currentAmount, { color: colors.foreground }]}>
                    {formatCurrency(current, attr.currency_symbol)}
                  </Text>
                  {target > 0 ? (
                    <Text style={[styles.targetAmount, { color: colors.muted }]}>
                      of {formatCurrency(target, attr.currency_symbol)}
                    </Text>
                  ) : null}
                </View>
                {target > 0 ? (
                  <>
                    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
                    </View>
                    <View style={styles.progressLabels}>
                      <View style={[styles.percentBadge, { backgroundColor: barColor + '14' }]}>
                        <Text style={[styles.percentText, { color: barColor }]}>{percentage.toFixed(0)}%</Text>
                      </View>
                      <Text style={[styles.remainingText, { color: colors.muted }]}>
                        {formatCurrency(Math.max(target - current, 0), attr.currency_symbol)} to go
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          <EmptyState icon="savings" title="No piggy banks" subtitle="Start saving towards your goals" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
      <FloatingActionButton onPress={() => router.push('/modals/piggy-form' as any)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 18, borderWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  titleCol: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  progressSection: { marginTop: 14 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  currentAmount: { fontSize: 18, fontWeight: '700' },
  targetAmount: { fontSize: 13, fontWeight: '500' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  percentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  percentText: { fontSize: 12, fontWeight: '700' },
  remainingText: { fontSize: 12, fontWeight: '500' },
});
