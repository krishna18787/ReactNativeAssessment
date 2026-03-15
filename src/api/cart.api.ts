import { debugLog } from '../../logger';
import { BASE_URL, TAX_RATE } from '../config/constants';
import { CartItemModel, CartModel } from '../models/CartModel';
import { getCurrentUser } from './auth.helper';
import { request } from './http';

/* ================= GET CART ================= */
export async function getCart(): Promise<CartModel> {
  const user = await getCurrentUser();
  // JSON Server v1 seems to have trouble filtering by numeric-looking strings,
  // so fetch all cart entries and filter on the client side to ensure we only
  // return items belonging to the current user.
  const allItems = await request<CartItemModel[]>(`${BASE_URL}/cart`);
  const items = allItems.filter(i => String(i.userId) === String(user.id));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  debugLog(items, subtotal, tax, total);
  return { items, subtotal, tax, total };
}

/* ================= ADD TO CART ================= */
export async function addToCart(
  item: Omit<CartItemModel, 'qty' | 'userId'>,
  qty = 1,
) {
  const user = await getCurrentUser();

  // fetch items with matching productId (all users), then pick the one
  // belonging to current user; this avoids server filter bugs
  const possible = await request<CartItemModel[]>(
    `${BASE_URL}/cart?productId=${item.productId}`,
  );
  const existingItem = possible.find(i => String(i.userId) === String(user.id));

  if (existingItem) {
    return updateCartItemQty(item.productId, existingItem.qty + qty);
  }

  return request(`${BASE_URL}/cart`, {
    method: 'POST',
    body: JSON.stringify({
      ...item,
      qty,
      userId: user.id,
    }),
  });
}

// ---------------- UPDATE QTY ----------------
export async function updateCartItemQty(productId: string, qty: number) {
  const user = await getCurrentUser();
  if (qty <= 0) return removeFromCart(productId);

  // fetch items with this productId and then ensure we update the one for
  // current user
  const all = await request<CartItemModel[]>(
    `${BASE_URL}/cart?productId=${productId}`,
  );
  const item = all.find(i => String(i.userId) === String(user.id));
  if (!item) return;

  return request(`${BASE_URL}/cart/${item.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ qty }),
  });
}

// ---------------- REMOVE ITEM ----------------
export async function removeFromCart(productId: string) {
  const user = await getCurrentUser();
  const all = await request<CartItemModel[]>(
    `${BASE_URL}/cart?productId=${productId}`,
  );
  const item = all.find(i => String(i.userId) === String(user.id));

  if (!item) return;

  await request(`${BASE_URL}/cart/${item.id}`, {
    method: 'DELETE',
  });
}

// ---------------- CLEAR CART ----------------
export async function clearCart(): Promise<void> {
  const user = await getCurrentUser();
  const allItems = await request<CartItemModel[]>(`${BASE_URL}/cart`);
  const items = allItems.filter(i => String(i.userId) === String(user.id));

  if (!items.length) return;

  await Promise.all(
    items.map(item =>
      request(`${BASE_URL}/cart/${item.id}`, {
        method: 'DELETE',
      }),
    ),
  );
}
