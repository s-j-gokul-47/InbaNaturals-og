import axios, { AxiosError } from 'axios';
import type {
  User,
  Product,
  ProductListItem,
  Cart,
  Order,
  OrderListItem,
  Review,
  Wallet,
  DashboardStats,
} from '../types';

// API Base URL: checks env var, falls back to relative /api (proxied by Vite) or localhost:8000/api
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.port === '5173'
    ? '/api'
    : 'http://localhost:8000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized & token expiration
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to extract user-friendly error message from FastAPI response
 */
export function getApiErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      // Pydantic validation errors list
      return detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
    }
    if (error.response?.data?.message) {
      return String(error.response.data.message);
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}

// ─────────────────────────────────────────────────────────────
// Type-safe Service Modules for FastAPI REST Endpoints (/api/...)
// ─────────────────────────────────────────────────────────────

export const authApi = {
  login: async (username: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
  }): Promise<User> => {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const res = await api.get(`/auth/verify-email`, { params: { token } });
    return res.data;
  },
};

export const productsApi = {
  list: async (params?: {
    category?: string;
    search?: string;
    sort?: string;
    featured?: boolean | string;
    page?: number;
    page_size?: number;
  }): Promise<ProductListItem[]> => {
    const res = await api.get<ProductListItem[]>('/products', { params });
    return res.data;
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const res = await api.get<Product>(`/products/slug/${slug}`);
    return res.data;
  },

  getById: async (id: number): Promise<Product> => {
    const res = await api.get<Product>(`/products/${id}`);
    return res.data;
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    const res = await api.post<Product>('/products', data);
    return res.data;
  },

  update: async (id: number, data: Partial<Product>): Promise<Product> => {
    const res = await api.put<Product>(`/products/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
};

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const res = await api.get<Cart>('/cart');
    return res.data;
  },

  addItem: async (productId: number, size: number, quantity: number): Promise<Cart> => {
    const res = await api.post<Cart>('/cart', {
      product_id: productId,
      size,
      quantity,
    });
    return res.data;
  },

  updateItem: async (itemId: number, quantity: number): Promise<Cart> => {
    const res = await api.put<Cart>(`/cart/${itemId}`, { quantity });
    return res.data;
  },

  removeItem: async (itemId: number): Promise<Cart> => {
    const res = await api.delete<Cart>(`/cart/${itemId}`);
    return res.data;
  },

  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },
};

export const ordersApi = {
  createOrder: async (payload: {
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    notes?: string;
  }): Promise<Order> => {
    const res = await api.post<Order>('/orders', payload);
    return res.data;
  },

  listOrders: async (): Promise<OrderListItem[]> => {
    const res = await api.get<OrderListItem[]>('/orders');
    return res.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const res = await api.get<Order>(`/orders/${id}`);
    return res.data;
  },
};

export const walletApi = {
  getWallet: async (): Promise<Wallet> => {
    const res = await api.get<Wallet>('/wallet');
    return res.data;
  },

  addFunds: async (amount: number, paymentMethod = 'card'): Promise<Wallet> => {
    const res = await api.post<Wallet>('/wallet/add-funds', {
      amount,
      payment_method: paymentMethod,
    });
    return res.data;
  },
};

export const reviewsApi = {
  getProductReviews: async (productId: number): Promise<Review[]> => {
    const res = await api.get<Review[]>(`/products/${productId}/reviews`);
    return res.data;
  },

  createReview: async (
    productId: number,
    data: { rating: number; comment: string }
  ): Promise<Review> => {
    const res = await api.post<Review>(`/products/${productId}/reviews`, data);
    return res.data;
  },
};

export const adminApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/admin/dashboard');
    return res.data;
  },

  getUsers: async (page = 1, pageSize = 50): Promise<User[]> => {
    const res = await api.get<User[]>('/admin/users', {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  getOrders: async (page = 1, pageSize = 50): Promise<Order[]> => {
    const res = await api.get<Order[]>('/admin/orders', {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  updateOrderStatus: async (orderId: number, status: string): Promise<Order> => {
    const res = await api.put<Order>(`/admin/orders/${orderId}/status`, { status });
    return res.data;
  },

  getPendingReviews: async (): Promise<Review[]> => {
    const res = await api.get<Review[]>('/admin/reviews/pending');
    return res.data;
  },

  approveReview: async (reviewId: number): Promise<{ message: string }> => {
    const res = await api.put(`/admin/reviews/${reviewId}/approve`);
    return res.data;
  },

  deleteReview: async (reviewId: number): Promise<{ message: string }> => {
    const res = await api.delete(`/admin/reviews/${reviewId}`);
    return res.data;
  },
};

export const contactApi = {
  submit: async (data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<{ status: string; message: string }> => {
    const res = await api.post('/contact', data);
    return res.data;
  },
};

export const healthApi = {
  check: async (): Promise<{ status: string; app: string }> => {
    const res = await api.get('/health');
    return res.data;
  },
};

export default api;
