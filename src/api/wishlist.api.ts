import { BASE_URL } from '../config/constants';
import { WishlistItemModel } from '../models/WishlistModel';
import { getCurrentUser } from './auth.helper';
import { request } from './http';

/* ================= GET WISHLIST ================= */
export async function getWishlistItems(): Promise<WishlistItemModel[]> {
  const user = await getCurrentUser();
  // JSON Server may mishandle numeric-looking userIds; fetch everything and
  // filter locally to be safe
  const all = await request<WishlistItemModel[]>(`${BASE_URL}/wishlist`);
  return all.filter(i => String(i.userId) === String(user.id));
}

/* ================= ADD TO WISHLIST ================= */
export async function addToWishlist(
  productId: string,
): Promise<WishlistItemModel> {
  const user = await getCurrentUser();

  // Check if already in wishlist to avoid duplicates
  // JSON Server struggles when filtering by two params together; fetch
  // everything and find the item for this user.
  const allItems = await request<WishlistItemModel[]>(
    `${BASE_URL}/wishlist?productId=${productId}`,
  );
  const existing = allItems.find(
    i => String(i.userId) === String(user.id),
  );

  if (existing) {
    return existing;
  }

  return request<WishlistItemModel>(`${BASE_URL}/wishlist`, {
    method: 'POST',
    body: JSON.stringify({
      productId,
      userId: user.id,
    }),
  });
}

/* ================= REMOVE FROM WISHLIST ================= */
export async function removeFromWishlist(productId: string): Promise<void> {
  const user = await getCurrentUser();
  // fetch entries with this product and manually filter by user
  const items = await request<WishlistItemModel[]>(
    `${BASE_URL}/wishlist?productId=${productId}`,
  );
  const toDelete = items.filter(
    i => String(i.userId) === String(user.id),
  );
  if (toDelete.length === 0) return;

  await Promise.all(
    toDelete.map(item =>
      request(`${BASE_URL}/wishlist/${item.id}`, {
        method: 'DELETE',
      }),
    ),
  );
}
