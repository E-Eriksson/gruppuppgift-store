import { create } from 'zustand';

export type CartItem = {
  category?: any;  // Lägg till ? för att göra optional
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

// Resten av din cart.ts förblir exakt samma...
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
      
      // Track add to cart
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'add_to_cart', {
          currency: 'SEK',
          value: item.price,
          items: [
            {
              item_id: item.id.toString(),
              item_name: item.name,
              price: item.price,
              item_category: item.category?.name || item.category || '',
            },
          ],
        });
      }
      
      return { items: newItems };
    }),
  removeFromCart: (id) =>
    set((state) => {
      const itemToRemove = state.items.find((i) => i.id === id);
      const newItems = state.items.filter((i) => i.id !== id);
      localStorage.setItem('cart-items', JSON.stringify(newItems));
      
      // Track remove from cart
      if (itemToRemove && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'remove_from_cart', {
          currency: 'SEK',
          value: itemToRemove.price,
          items: [
            {
              item_id: itemToRemove.id.toString(),
              item_name: itemToRemove.name,
              price: itemToRemove.price,
              item_category: itemToRemove.category?.name || itemToRemove.category || '',
            },
          ],
        });
      }
      
      return { items: newItems };
    }),
  clearCart: () => {
    localStorage.setItem('cart-items', '[]');
    set({ items: [] });
  },
}));