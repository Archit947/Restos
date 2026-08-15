import { create } from 'zustand';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  currency: string;
  is_veg: boolean;
}

interface CartStore {
  items: CartItem[];
  open: boolean;
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  open: false,
  addItem: (item) => set(state => {
    const existing = state.items.find(i => i.id === item.id);
    if (existing) {
      return { items: state.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) };
    }
    return { items: [...state.items, { ...item, qty: 1 }] };
  }),
  removeItem: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),
  updateQty: (id, qty) => set(state => {
    if (qty <= 0) return { items: state.items.filter(i => i.id !== id) };
    return { items: state.items.map(i => i.id === id ? { ...i, qty } : i) };
  }),
  clearCart: () => set({ items: [] }),
  setOpen: (open) => set({ open }),
  total: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
  count: () => get().items.reduce((s, i) => s + i.qty, 0),
}));
