import { useWishlistStore } from '../src/store/wishlistStore';
import {
  getWishlistItems,
  addToWishlist,
  removeFromWishlist,
} from '../src/api/wishlist.api';

jest.mock('../src/api/wishlist.api');

describe('wishlistStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWishlistStore.setState({
      wishlistIds: [],
      loading: false,
    });
  });

  it('fetches wishlist items correctly', async () => {
    const mockItems = [
      { id: 1, productId: 'p_1', userId: 'u_1' },
      { id: 2, productId: 'p_2', userId: 'u_1' },
    ];
    (getWishlistItems as jest.Mock).mockResolvedValue(mockItems);

    await useWishlistStore.getState().fetchWishlist();

    expect(useWishlistStore.getState().wishlistIds).toEqual(['p_1', 'p_2']);
    expect(useWishlistStore.getState().loading).toBe(false);
  });

  it('adds item to wishlist optimistically', async () => {
    (addToWishlist as jest.Mock).mockResolvedValue({
      id: 1,
      productId: 'p_1',
      userId: 'u_1',
    });

    await useWishlistStore.getState().toggleWishlist('p_1');

    expect(useWishlistStore.getState().wishlistIds).toContain('p_1');
    expect(addToWishlist).toHaveBeenCalledWith('p_1');
  });

  it('removes item from wishlist optimistically', async () => {
    useWishlistStore.setState({ wishlistIds: ['p_1'] });
    (removeFromWishlist as jest.Mock).mockResolvedValue(undefined);

    await useWishlistStore.getState().toggleWishlist('p_1');

    expect(useWishlistStore.getState().wishlistIds).not.toContain('p_1');
    expect(removeFromWishlist).toHaveBeenCalledWith('p_1');
  });

  it('reverts state on toggle error', async () => {
    const initialIds = ['p_1'];
    useWishlistStore.setState({ wishlistIds: initialIds });
    (removeFromWishlist as jest.Mock).mockRejectedValue(new Error('API Error'));

    await useWishlistStore.getState().toggleWishlist('p_1');

    // Should have reverted to initialIds after failure
    expect(useWishlistStore.getState().wishlistIds).toEqual(initialIds);
  });

  it('clears wishlist', () => {
    useWishlistStore.setState({ wishlistIds: ['p_1', 'p_2'] });
    useWishlistStore.getState().clearWishlist();
    expect(useWishlistStore.getState().wishlistIds).toEqual([]);
  });
});
