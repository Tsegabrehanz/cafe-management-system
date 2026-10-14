/** Remembers the customer's recent order codes in this browser (best effort). */
const KEY = 'cafe.myOrders';

export interface SavedOrder { code: string; total: number; at: string; }

export function loadMyOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedOrder[]) : [];
    return Array.isArray(list) ? list.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function rememberOrder(code: string, total: number): void {
  try {
    const list = [{ code, total, at: new Date().toISOString() }, ...loadMyOrders().filter(o => o.code !== code)];
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 5)));
  } catch { /* storage unavailable — tracking by code still works */ }
}
