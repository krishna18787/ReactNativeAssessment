import { BASE_URL } from '../config/constants';
import { OrderModel } from '../models/OrderModel';
import { getCurrentUser } from './auth.helper';
import { request } from './http';

interface GetOrdersParams {
  page?: number;
  limit?: number;
}

export async function getOrders({
  page = 1,
  limit = 10,
}: GetOrdersParams): Promise<OrderModel[]> {
  const user = await getCurrentUser();

  // JSON Server v1 filters break when combined with `_order`; additionally
  // `userId` may be numeric in the DB, so perform all filtering/sorting/paging
  // on the client side for reliability.
  const resp = await request<{ data: OrderModel[] }>(
    `${BASE_URL}/orders`,
  );
  let orders = (resp as any).data || resp;

  // filter by current user
  orders = orders.filter(o => String(o.userId) === String(user.id));

  // sort descending by createdAt
  orders.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // paginate
  const start = (page - 1) * limit;
  return orders.slice(start, start + limit);
}

export async function getOrderById(orderId: string): Promise<OrderModel> {
  const user = await getCurrentUser();
  return request<OrderModel>(`${BASE_URL}/orders/${orderId}?userId=${user.id}`);
}
