import { create } from 'zustand';
import {
  getWishlistItems,
  addToWishlist,
  removeFromWishlist,
} from '../api/wishlist.api';
import { debugLog } from '../../logger';

interface WishlistState {
  wishlistIds: string[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  wishlistIds: [],
  loading: false,

  fetchWishlist: async () => {
    set({ loading: true });
    try {
      const items = await getWishlistItems();
      set({ wishlistIds: items.map(i => i.productId) });
    } catch (error) {
      debugLog('Failed to fetch wishlist', error);
    } finally {
      set({ loading: false });
    }
  },

  toggleWishlist: async (productId: string) => {
    const { wishlistIds } = get();
    const isExist = wishlistIds.includes(productId);

    try {
      if (isExist) {
        // Optimistic update
        set({ wishlistIds: wishlistIds.filter(id => id !== productId) });
        await removeFromWishlist(productId);
      } else {
        // Optimistic update
        set({ wishlistIds: [...wishlistIds, productId] });
        await addToWishlist(productId);
      }
    } catch (error) {
      debugLog('Failed to toggle wishlist', error);
      // Revert on error
      set({ wishlistIds });
    }
  },

  isInWishlist: (productId: string) => {
    return get().wishlistIds.includes(productId);
  },

  clearWishlist: () => {
    set({ wishlistIds: [] });
  },
}));
