import { create } from 'zustand';

export type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

type CartState = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
};

export const useCart = create<CartState>((set) => ({
  items: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('cart-items') || '[]')
    : [],
  addToCart: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      let newItems;
      if (existing) {
        newItems = state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [...state.items, { ...item, quantity: 1 }];
      }
      localStorage.setItem('cart-items', JSON.stringify(newItems));
      return { items: newItems };
    }),
  removeFromCart: (id) =>
    set((state) => {
      const newItems = state.items.filter((i) => i.id !== id);
      localStorage.setItem('cart-items', JSON.stringify(newItems));
      return { items: newItems };
    }),
  clearCart: () => {
    localStorage.setItem('cart-items', '[]');
    set({ items: [] });
  },
}));