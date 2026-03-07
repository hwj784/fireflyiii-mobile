import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CurrenciesScreen() {
  const colors = useColors();
  const router = useRouter();

  const query = useQuery({ queryKey: ['currencies'], queryFn: () => api.getCurrencies(1) });
  const currencies = query.data?.data || [];

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground flex-1">Currencies</Text>
      </View>
      <FlatList
        data={currencies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const attr = item.attributes;
          return (
            <View className="bg-surface rounded-xl p-4 mx-4 mb-2 border border-border flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-base font-bold text-primary">{attr.symbol}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">{attr.name}</Text>
                <Text className="text-xs text-muted">{attr.code} · {attr.decimal_places} decimals</Text>
              </View>
              {attr.default ? (
                <View className="bg-primary/10 px-2 py-1 rounded-full">
                  <Text className="text-xs text-primary font-medium">Default</Text>
                </View>
              ) : attr.enabled ? (
                <View className="bg-success/10 px-2 py-1 rounded-full">
                  <Text className="text-xs text-success font-medium">Enabled</Text>
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : <Text className="text-muted text-center py-8">No currencies</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}
