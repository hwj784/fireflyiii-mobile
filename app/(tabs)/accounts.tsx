import React, { useState, useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, getAccountTypeLabel, getAccountIcon } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ACCOUNT_TYPES = ['asset', 'expense', 'revenue', 'liabilities'];

export default function AccountsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeType, setActiveType] = useState('asset');

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeType],
    queryFn: () => api.getAccounts(1, activeType),
  });

  const accounts = accountsQuery.data?.data || [];

  const onRefresh = useCallback(() => {
    accountsQuery.refetch();
  }, []);

  const renderAccount = ({ item }: { item: any }) => {
    const attr = item.attributes;
    const iconName = getAccountIcon(attr.type, attr.account_role) as any;
    const balance = parseFloat(attr.current_balance || '0');
    const balanceColor = balance >= 0 ? colors.foreground : colors.error;

    return (
      <TouchableOpacity
        className="bg-surface rounded-xl p-4 mx-4 mb-2 border border-border flex-row items-center"
        onPress={() => router.push(`/details/account/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <MaterialIcons name={iconName} size={20} color={colors.primary} />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-base font-medium text-foreground" numberOfLines={1}>{attr.name}</Text>
          {attr.iban ? (
            <Text className="text-xs text-muted" numberOfLines={1}>{attr.iban}</Text>
          ) : attr.account_number ? (
            <Text className="text-xs text-muted" numberOfLines={1}>{attr.account_number}</Text>
          ) : (
            <Text className="text-xs text-muted">{(attr.account_role || attr.type || '').replace(/-/g, ' ')}</Text>
          )}
        </View>
        <Text className="text-base font-semibold" style={{ color: balanceColor }}>
          {formatCurrency(attr.current_balance, attr.currency_symbol)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-2xl font-bold text-foreground mb-3">Accounts</Text>
        <View className="flex-row gap-2">
          {ACCOUNT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              className={`px-3 py-1.5 rounded-full ${activeType === type ? 'bg-primary' : 'bg-surface border border-border'}`}
              onPress={() => setActiveType(type)}
            >
              <Text className={`text-xs font-medium ${activeType === type ? 'text-white' : 'text-muted'}`}>
                {getAccountTypeLabel(type).replace(' Accounts', '')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccount}
        ListEmptyComponent={
          accountsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text className="text-muted text-center py-8">No {getAccountTypeLabel(activeType).toLowerCase()} found</Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={accountsQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />

      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        onPress={() => router.push('/modals/account-form' as any)}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}
