import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // Tab icons
  "dashboard": "dashboard",
  "account-balance": "account-balance",
  "receipt-long": "receipt-long",
  "pie-chart": "pie-chart",
  "more-horiz": "more-horiz",
  // Account icons
  "account-balance-wallet": "account-balance-wallet",
  "credit-card": "credit-card",
  "savings": "savings",
  "shopping-cart": "shopping-cart",
  "trending-up": "trending-up",
  "money-off": "money-off",
  // Action icons
  "add": "add",
  "edit": "edit",
  "delete": "delete",
  "search": "search",
  "filter-list": "filter-list",
  "refresh": "refresh",
  "close": "close",
  "check": "check",
  "arrow-back": "arrow-back",
  "settings": "settings",
  "logout": "logout",
  "info": "info",
  // Transaction type icons
  "arrow-downward": "arrow-downward",
  "arrow-upward": "arrow-upward",
  "swap-horiz": "swap-horiz",
  // Feature icons
  "label": "label",
  "category": "category",
  "local-offer": "local-offer",
  "event-repeat": "event-repeat",
  "rule": "rule",
  "description": "description",
  "attach-money": "attach-money",
  "bar-chart": "bar-chart",
  "show-chart": "show-chart",
  "donut-large": "donut-large",
  "currency-exchange": "currency-exchange",
  "notifications": "notifications",
  "calendar-today": "calendar-today",
  "flag": "flag",
  "link": "link",
  "webhook": "webhook",
  "folder": "folder",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mappedName = MAPPING[name] || "help-outline";
  return <MaterialIcons color={color} size={size} name={mappedName} style={style} />;
}
