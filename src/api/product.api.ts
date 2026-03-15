import { BASE_URL } from '../config/constants';
import { ProductModel } from '../models/ProductModel';
import { request } from './http';

interface GetProductsParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  sort?: 'price';
  order?: 'asc' | 'desc';
  ids?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export async function getProducts({
  page = 1,
  limit = 10,
  q,
  category,
  sort,
  order = 'asc',
  ids,
  minPrice,
  maxPrice,
}: GetProductsParams): Promise<ProductModel[]> {
  const params = new URLSearchParams({
    _page: String(page),
    _per_page: String(limit),
  });

  // Only add sort and order if sort is explicitly provided
  if (sort) {
    params.append('_sort', sort);
    params.append('_order', order);
  }

  if (q) params.append('title_like', q);
  if (category) params.append('category', category);
  if (minPrice !== undefined) params.append('price_gte', String(minPrice));
  if (maxPrice !== undefined) params.append('price_lte', String(maxPrice));
  if (ids && ids.length > 0) {
    // JSON Server v1 ignores multiple `id` query params; we'll fetch each id
    // individually and merge the results to avoid losing items.
    const results: ProductModel[] = [];
    for (const id of ids) {
      const res = await request<{ data: ProductModel[] }>(
        `${BASE_URL}/products?id=${encodeURIComponent(id)}`,
      );
      // response may or may not be wrapped (depending on config), so handle both
      const arr = (res as any).data || res;
      if (Array.isArray(arr) && arr.length) {
        results.push(arr[0]);
      }
    }
    return results;
  }

  console.log('Fetching products with params:', params.toString(), BASE_URL);
  const response = await request<{ data: ProductModel[] }>(
    `${BASE_URL}/products?${params.toString()}`,
  );
  return response.data || response;
}

export function getProductById(productId: string): Promise<ProductModel> {
  return request(`${BASE_URL}/products/${productId}`);
}

export function updateProductStock(
  productId: string,
  newStock: number,
): Promise<ProductModel> {
  return request(`${BASE_URL}/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ stock: newStock }),
  });
}
