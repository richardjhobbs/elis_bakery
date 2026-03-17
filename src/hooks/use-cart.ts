import { create } from "zustand";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

interface CartState {
  items: Record<string, CartItem>;
  customerName: string;
  whatsappNumber: string;
  collectionDay: string;
  setQuantity: (productId: string, quantity: number, price: number, name: string) => void;
  setCustomerName: (name: string) => void;
  setWhatsappNumber: (number: string) => void;
  setCollectionDay: (day: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
  reset: () => void;
}

export const useCart = create<CartState>((set, get) => ({
  items: {},
  customerName: "",
  whatsappNumber: "",
  collectionDay: "",

  setQuantity: (productId, quantity, price, name) =>
    set((state) => {
      const newItems = { ...state.items };
      if (quantity <= 0) {
        delete newItems[productId];
      } else {
        newItems[productId] = { productId, quantity, price, name };
      }
      return { items: newItems };
    }),

  setCustomerName: (name) => set({ customerName: name }),
  setWhatsappNumber: (number) => set({ whatsappNumber: number }),
  setCollectionDay: (day) => set({ collectionDay: day }),

  getTotal: () => {
    const { items } = get();
    return Object.values(items).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  },

  getItemCount: () => {
    const { items } = get();
    return Object.values(items).reduce((sum, item) => sum + item.quantity, 0);
  },

  reset: () =>
    set({
      items: {},
      customerName: "",
      whatsappNumber: "",
      collectionDay: "",
    }),
}));
