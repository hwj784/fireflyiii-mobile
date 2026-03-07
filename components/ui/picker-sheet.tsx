import React, { useState, useMemo } from 'react';
import {
  Text, View, TextInput, TouchableOpacity, FlatList, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface PickerItem {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string;
  color?: string;
}

interface PickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: PickerItem[];
  selectedId?: string;
  selectedIds?: string[];
  onSelect: (item: PickerItem) => void;
  onMultiSelect?: (items: PickerItem[]) => void;
  multiSelect?: boolean;
  searchable?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
  onCustomSubmit?: (value: string) => void;
  loading?: boolean;
}

export function PickerSheet({
  visible,
  onClose,
  title,
  items,
  selectedId,
  selectedIds = [],
  onSelect,
  onMultiSelect,
  multiSelect = false,
  searchable = true,
  allowCustom = false,
  customPlaceholder = 'Enter custom value...',
  onCustomSubmit,
  loading = false,
}: PickerSheetProps) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q))
    );
  }, [items, search]);

  const handleSelect = (item: PickerItem) => {
    if (multiSelect) {
      setLocalSelectedIds((prev) => {
        const exists = prev.includes(item.id);
        return exists ? prev.filter((id) => id !== item.id) : [...prev, item.id];
      });
    } else {
      onSelect(item);
      setSearch('');
      onClose();
    }
  };

  const handleDone = () => {
    if (multiSelect && onMultiSelect) {
      const selected = items.filter((item) => localSelectedIds.includes(item.id));
      onMultiSelect(selected);
    }
    setSearch('');
    onClose();
  };

  const handleCustomSubmit = () => {
    if (search.trim() && onCustomSubmit) {
      onCustomSubmit(search.trim());
      setSearch('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => { setSearch(''); onClose(); }}
        />
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70%',
            minHeight: 300,
          }}
        >
          {/* Handle bar */}
          <View className="items-center pt-2 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row items-center px-4 py-2">
            <Text className="text-lg font-semibold text-foreground flex-1">{title}</Text>
            {multiSelect ? (
              <TouchableOpacity onPress={handleDone}>
                <Text className="text-base font-semibold text-primary">Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { setSearch(''); onClose(); }}>
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search */}
          {searchable ? (
            <View className="px-4 pb-2">
              <View className="flex-row items-center bg-surface border border-border rounded-xl px-3">
                <MaterialIcons name="search" size={20} color={colors.muted} />
                <TextInput
                  className="flex-1 py-2.5 px-2 text-base text-foreground"
                  placeholder="Search..."
                  placeholderTextColor={colors.muted}
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                  returnKeyType={allowCustom ? 'done' : 'search'}
                  onSubmitEditing={allowCustom ? handleCustomSubmit : undefined}
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <MaterialIcons name="close" size={18} color={colors.muted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Items */}
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = multiSelect
                ? localSelectedIds.includes(item.id)
                : item.id === selectedId;
              return (
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3 border-b border-border/30"
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.6}
                >
                  {item.icon ? (
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: (item.color || colors.primary) + '18' }}
                    >
                      <MaterialIcons name={item.icon as any} size={16} color={item.color || colors.primary} />
                    </View>
                  ) : item.color ? (
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: item.color + '18' }}
                    >
                      <Text className="text-xs font-bold" style={{ color: item.color }}>
                        {item.label.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                  <View className="flex-1 mr-2">
                    <Text className="text-base text-foreground" numberOfLines={1}>
                      {item.label}
                    </Text>
                    {item.sublabel ? (
                      <Text className="text-xs text-muted" numberOfLines={1}>
                        {item.sublabel}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <MaterialIcons
                      name={multiSelect ? 'check-box' : 'check-circle'}
                      size={22}
                      color={colors.primary}
                    />
                  ) : multiSelect ? (
                    <MaterialIcons name="check-box-outline-blank" size={22} color={colors.border} />
                  ) : null}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View className="py-8 items-center">
                {loading ? (
                  <Text className="text-muted">Loading...</Text>
                ) : allowCustom && search.trim() ? (
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3"
                    onPress={handleCustomSubmit}
                  >
                    <MaterialIcons name="add" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text className="text-base text-primary">Use "{search.trim()}"</Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-muted">No items found</Text>
                )}
              </View>
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Convenience: A touchable field that opens a picker
interface PickerFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  required?: boolean;
  icon?: string;
}

export function PickerField({ label, value, placeholder, onPress, required, icon }: PickerFieldProps) {
  const colors = useColors();
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-1">
        {label}{required ? ' *' : ''}
      </Text>
      <TouchableOpacity
        className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center"
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon ? (
          <MaterialIcons name={icon as any} size={18} color={colors.muted} style={{ marginRight: 8 }} />
        ) : null}
        <Text
          className={`flex-1 text-base ${value ? 'text-foreground' : 'text-muted'}`}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

// Multi-value display field (for tags)
interface MultiPickerFieldProps {
  label: string;
  values: string[];
  placeholder: string;
  onPress: () => void;
  onRemove?: (value: string) => void;
}

export function MultiPickerField({ label, values, placeholder, onPress, onRemove }: MultiPickerFieldProps) {
  const colors = useColors();
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-1">{label}</Text>
      <TouchableOpacity
        className="bg-surface border border-border rounded-xl px-4 py-3"
        onPress={onPress}
        activeOpacity={0.7}
      >
        {values.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {values.map((v) => (
              <View
                key={v}
                className="flex-row items-center bg-primary/10 rounded-lg px-2.5 py-1"
              >
                <Text className="text-sm text-primary mr-1">{v}</Text>
                {onRemove ? (
                  <TouchableOpacity onPress={() => onRemove(v)}>
                    <MaterialIcons name="close" size={14} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-muted">{placeholder}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.muted} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
