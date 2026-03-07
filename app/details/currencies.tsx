import React from 'react';
import { Text, View, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { ScreenNavBar, EmptyState } from '@/components/ui/styled-list-screen';

export default function CurrenciesScreen() {
  const colors = useColors();
  const query = useQuery({ queryKey: ['currencies'], queryFn: () => api.getCurrencies(1) });
  const currencies = query.data?.data || [];

  return (
    <ScreenContainer>
      <FlatList
        data={currencies}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ScreenNavBar title="Currencies" />}
        renderItem={({ item }) => {
          const attr = item.attributes;
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.symbolBg, { backgroundColor: colors.primary + '14' }]}>
                <Text style={[styles.symbolText, { color: colors.primary }]}>{attr.symbol}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.foreground }]}>{attr.name}</Text>
                <Text style={[styles.meta, { color: colors.muted }]}>{attr.code} · {attr.decimal_places} decimals</Text>
              </View>
              {attr.default ? (
                <View style={[styles.badge, { backgroundColor: colors.primary + '14' }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>Default</Text>
                </View>
              ) : attr.enabled ? (
                <View style={[styles.badge, { backgroundColor: colors.success + '14' }]}>
                  <Text style={[styles.badgeText, { color: colors.success }]}>Enabled</Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: colors.muted + '14' }]}>
                  <Text style={[styles.badgeText, { color: colors.muted }]}>Disabled</Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          <EmptyState icon="currency-exchange" title="No currencies" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 16, borderWidth: 1 },
  symbolBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  symbolText: { fontSize: 18, fontWeight: '800' },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
