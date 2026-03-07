/**
 * Firefly III API Client
 * Handles all communication with the Firefly III REST API v1
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY_URL = 'firefly_server_url';
const STORAGE_KEY_TOKEN = 'firefly_access_token';

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function removeStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export interface ApiConfig {
  serverUrl: string;
  accessToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

export interface SingleResponse<T> {
  data: T;
}

class FireflyApi {
  private serverUrl: string = '';
  private accessToken: string = '';
  private initialized: boolean = false;

  async init(): Promise<boolean> {
    const url = await getStorageItem(STORAGE_KEY_URL);
    const token = await getStorageItem(STORAGE_KEY_TOKEN);
    if (url && token) {
      this.serverUrl = url.replace(/\/+$/, '');
      this.accessToken = token;
      this.initialized = true;
      return true;
    }
    return false;
  }

  async saveCredentials(serverUrl: string, accessToken: string): Promise<void> {
    this.serverUrl = serverUrl.replace(/\/+$/, '');
    this.accessToken = accessToken;
    await setStorageItem(STORAGE_KEY_URL, this.serverUrl);
    await setStorageItem(STORAGE_KEY_TOKEN, this.accessToken);
    this.initialized = true;
  }

  async clearCredentials(): Promise<void> {
    this.serverUrl = '';
    this.accessToken = '';
    this.initialized = false;
    await removeStorageItem(STORAGE_KEY_URL);
    await removeStorageItem(STORAGE_KEY_TOKEN);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getServerUrl(): string {
    return this.serverUrl;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.api+json',
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.serverUrl}/api${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async delete(path: string): Promise<void> {
    await this.request<void>('DELETE', path);
  }

  // ---- About / System ----
  async getAbout() {
    return this.get<SingleResponse<any>>('/v1/about');
  }

  async getCurrentUser() {
    return this.get<SingleResponse<any>>('/v1/about/user');
  }

  async getSummary(start: string, end: string, currencyCode?: string) {
    const params: Record<string, string> = { start, end };
    if (currencyCode) params.currency_code = currencyCode;
    return this.get<any>('/v1/summary/basic', params);
  }

  // ---- Accounts ----
  async getAccounts(page: number = 1, type?: string) {
    const params: Record<string, string> = { page: String(page) };
    if (type) params.type = type;
    return this.get<PaginatedResponse<any>>('/v1/accounts', params);
  }

  async getAccount(id: string) {
    return this.get<SingleResponse<any>>(`/v1/accounts/${id}`);
  }

  async createAccount(data: any) {
    return this.post<SingleResponse<any>>('/v1/accounts', data);
  }

  async updateAccount(id: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/accounts/${id}`, data);
  }

  async deleteAccount(id: string) {
    return this.delete(`/v1/accounts/${id}`);
  }

  async getAccountTransactions(id: string, page: number = 1, params?: Record<string, string>) {
    const p: Record<string, string> = { page: String(page), ...params };
    return this.get<PaginatedResponse<any>>(`/v1/accounts/${id}/transactions`, p);
  }

  // ---- Transactions ----
  async getTransactions(page: number = 1, params?: Record<string, string>) {
    const p: Record<string, string> = { page: String(page), ...params };
    return this.get<PaginatedResponse<any>>('/v1/transactions', p);
  }

  async getTransaction(id: string) {
    return this.get<SingleResponse<any>>(`/v1/transactions/${id}`);
  }

  async createTransaction(data: any) {
    return this.post<SingleResponse<any>>('/v1/transactions', data);
  }

  async updateTransaction(id: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/transactions/${id}`, data);
  }

  async deleteTransaction(id: string) {
    return this.delete(`/v1/transactions/${id}`);
  }

  async searchTransactions(query: string, page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/search/transactions', { query, page: String(page) });
  }

  // ---- Budgets ----
  async getBudgets(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/budgets', { page: String(page) });
  }

  async getBudget(id: string) {
    return this.get<SingleResponse<any>>(`/v1/budgets/${id}`);
  }

  async createBudget(data: any) {
    return this.post<SingleResponse<any>>('/v1/budgets', data);
  }

  async updateBudget(id: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/budgets/${id}`, data);
  }

  async deleteBudget(id: string) {
    return this.delete(`/v1/budgets/${id}`);
  }

  async getBudgetLimits(id: string, start?: string, end?: string) {
    const params: Record<string, string> = {};
    if (start) params.start = start;
    if (end) params.end = end;
    return this.get<PaginatedResponse<any>>(`/v1/budgets/${id}/limits`, params);
  }

  async createBudgetLimit(budgetId: string, data: any) {
    return this.post<SingleResponse<any>>(`/v1/budgets/${budgetId}/limits`, data);
  }

  async updateBudgetLimit(budgetId: string, limitId: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/budgets/${budgetId}/limits/${limitId}`, data);
  }

  async deleteBudgetLimit(budgetId: string, limitId: string) {
    return this.delete(`/v1/budgets/${budgetId}/limits/${limitId}`);
  }

  async getBudgetTransactions(id: string, page: number = 1, params?: Record<string, string>) {
    const p: Record<string, string> = { page: String(page), ...params };
    return this.get<PaginatedResponse<any>>(`/v1/budgets/${id}/transactions`, p);
  }

  // ---- Categories ----
  async getCategories(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/categories', { page: String(page) });
  }

  async getCategory(id: string) {
    return this.get<SingleResponse<any>>(`/v1/categories/${id}`);
  }

  async createCategory(data: any) {
    return this.post<SingleResponse<any>>('/v1/categories', data);
  }

  async updateCategory(id: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/categories/${id}`, data);
  }

  async deleteCategory(id: string) {
    return this.delete(`/v1/categories/${id}`);
  }

  async getCategoryTransactions(id: string, page: number = 1, params?: Record<string, string>) {
    const p: Record<string, string> = { page: String(page), ...params };
    return this.get<PaginatedResponse<any>>(`/v1/categories/${id}/transactions`, p);
  }

  // ---- Tags ----
  async getTags(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/tags', { page: String(page) });
  }

  async getTag(tag: string) {
    return this.get<SingleResponse<any>>(`/v1/tags/${encodeURIComponent(tag)}`);
  }

  async createTag(data: any) {
    return this.post<SingleResponse<any>>('/v1/tags', data);
  }

  async updateTag(tag: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/tags/${encodeURIComponent(tag)}`, data);
  }

  async deleteTag(tag: string) {
    return this.delete(`/v1/tags/${encodeURIComponent(tag)}`);
  }

  async getTagTransactions(tag: string, page: number = 1, params?: Record<string, string>) {
    const p: Record<string, string> = { page: String(page), ...params };
    return this.get<PaginatedResponse<any>>(`/v1/tags/${encodeURIComponent(tag)}/transactions`, p);
  }

  // ---- Piggy Banks ----
  async getPiggyBanks(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/piggy-banks', { page: String(page) });
  }

  async getPiggyBank(id: string) {
    return this.get<SingleResponse<any>>(`/v1/piggy-banks/${id}`);
  }

  async createPiggyBank(data: any) {
    return this.post<SingleResponse<any>>('/v1/piggy-banks', data);
  }

  async updatePiggyBank(id: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/piggy-banks/${id}`, data);
  }

  async deletePiggyBank(id: string) {
    return this.delete(`/v1/piggy-banks/${id}`);
  }

  async getPiggyBankEvents(id: string) {
    return this.get<PaginatedResponse<any>>(`/v1/piggy-banks/${id}/events`);
  }

  // ---- Bills ----
  async getBills(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/bills', { page: String(page) });
  }

  async getBill(id: string) {
    return this.get<SingleResponse<any>>(`/v1/bills/${id}`);
  }

  async createBill(data: any) {
    return this.post<SingleResponse<any>>('/v1/bills', data);
  }

  async updateBill(id: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/bills/${id}`, data);
  }

  async deleteBill(id: string) {
    return this.delete(`/v1/bills/${id}`);
  }

  async getBillTransactions(id: string, page: number = 1, params?: Record<string, string>) {
    const p: Record<string, string> = { page: String(page), ...params };
    return this.get<PaginatedResponse<any>>(`/v1/bills/${id}/transactions`, p);
  }

  // ---- Rules ----
  async getRules(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/rules', { page: String(page) });
  }

  async getRule(id: string) {
    return this.get<SingleResponse<any>>(`/v1/rules/${id}`);
  }

  async createRule(data: any) {
    return this.post<SingleResponse<any>>('/v1/rules', data);
  }

  async updateRule(id: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/rules/${id}`, data);
  }

  async deleteRule(id: string) {
    return this.delete(`/v1/rules/${id}`);
  }

  async testRule(id: string) {
    return this.get<any>(`/v1/rules/${id}/test`);
  }

  async triggerRule(id: string) {
    return this.post<any>(`/v1/rules/${id}/trigger`);
  }

  async fireRule(id: string) {
    return this.post<any>(`/v1/rules/${id}/trigger`);
  }

  // ---- Rule Groups ----
  async getRuleGroups(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/rule-groups', { page: String(page) });
  }

  async getRuleGroup(id: string) {
    return this.get<SingleResponse<any>>(`/v1/rule-groups/${id}`);
  }

  async getRuleGroupRules(id: string) {
    return this.get<PaginatedResponse<any>>(`/v1/rule-groups/${id}/rules`);
  }

  // ---- Recurring Transactions ----
  async getRecurrences(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/recurrences', { page: String(page) });
  }

  async getRecurringTransactions(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/recurrences', { page: String(page) });
  }

  async getRecurrence(id: string) {
    return this.get<SingleResponse<any>>(`/v1/recurrences/${id}`);
  }

  async createRecurrence(data: any) {
    return this.post<SingleResponse<any>>('/v1/recurrences', data);
  }

  async updateRecurrence(id: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/recurrences/${id}`, data);
  }

  async deleteRecurrence(id: string) {
    return this.delete(`/v1/recurrences/${id}`);
  }

  async deleteRecurringTransaction(id: string) {
    return this.delete(`/v1/recurrences/${id}`);
  }

  // ---- Charts ----
  async getAccountChart(start: string, end: string) {
    return this.get<any>('/v1/chart/account/overview', { start, end });
  }

  async getBudgetChart(start: string, end: string) {
    return this.get<any>('/v1/chart/budget/overview', { start, end });
  }

  async getCategoryChart(start: string, end: string) {
    return this.get<any>('/v1/chart/category/overview', { start, end });
  }

  // ---- Currencies ----
  async getCurrencies(page: number = 1) {
    return this.get<PaginatedResponse<any>>('/v1/currencies', { page: String(page) });
  }

  async getPrimaryCurrency() {
    return this.get<SingleResponse<any>>('/v1/currencies/primary');
  }

  async enableCurrency(code: string) {
    return this.post<any>(`/v1/currencies/${code}/enable`);
  }

  async disableCurrency(code: string) {
    return this.post<any>(`/v1/currencies/${code}/disable`);
  }

  async setPrimaryCurrency(code: string) {
    return this.post<any>(`/v1/currencies/${code}/primary`);
  }

  // ---- Autocomplete ----
  async autocomplete(resource: string, query: string, params?: Record<string, string>) {
    return this.get<any[]>(`/v1/autocomplete/${resource}`, { query, ...params });
  }

  // ---- Preferences ----
  async getPreferences() {
    return this.get<PaginatedResponse<any>>('/v1/preferences');
  }

  async getPreference(name: string) {
    return this.get<SingleResponse<any>>(`/v1/preferences/${name}`);
  }

  async updatePreference(name: string, data: any) {
    return this.put<SingleResponse<any>>(`/v1/preferences/${name}`, data);
  }

  // ---- Insight ----
  async getInsight(type: string, grouping: string, start: string, end: string) {
    return this.get<any[]>(`/v1/insight/${type}/${grouping}`, { start, end });
  }
}

export const api = new FireflyApi();
export default api;
