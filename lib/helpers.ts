/**
 * Utility helpers for Firefly III data formatting
 */

export function formatCurrency(amount: string | number, currencySymbol?: string, currencyCode?: string, decimalPlaces: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  const formatted = Math.abs(num).toFixed(decimalPlaces);
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const symbol = currencySymbol || currencyCode || '';
  const prefix = num < 0 ? '-' : '';
  return `${prefix}${symbol}${parts.join('.')}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getTransactionColor(type: string): string {
  switch (type) {
    case 'withdrawal': return 'error';
    case 'deposit': return 'success';
    case 'transfer': return 'primary';
    case 'opening-balance': return 'muted';
    case 'reconciliation': return 'warning';
    default: return 'foreground';
  }
}

export function getTransactionSign(type: string): string {
  switch (type) {
    case 'withdrawal': return '-';
    case 'deposit': return '+';
    default: return '';
  }
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'asset': 'Asset Accounts',
    'expense': 'Expense Accounts',
    'revenue': 'Revenue Accounts',
    'liability': 'Liabilities',
    'liabilities': 'Liabilities',
    'cash': 'Cash Accounts',
  };
  return labels[type] || type;
}

export function getAccountIcon(type: string, role?: string): string {
  if (role === 'ccAsset' || role === 'creditCard') return 'credit-card';
  if (role === 'savingAsset') return 'savings';
  if (role === 'cashWalletAsset') return 'account-balance-wallet';
  switch (type) {
    case 'asset': return 'account-balance';
    case 'expense': return 'shopping-cart';
    case 'revenue': return 'trending-up';
    case 'liability':
    case 'liabilities': return 'money-off';
    default: return 'account-balance';
  }
}

export function getStartOfMonth(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function getEndOfMonth(date?: Date): string {
  const d = date || new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
}

export function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseAmount(str: string): number {
  return parseFloat(str) || 0;
}
