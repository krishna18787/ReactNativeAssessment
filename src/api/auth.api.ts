import { BASE_URL } from '../config/constants';
import { request } from './http';
import { generateToken } from '../utils/token';
import { debugLog } from '../../logger';

/* ======================= */
/* TYPES */
/* ======================= */
interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/* ======================= */
/* REGISTER */
/* ======================= */
export const registerApi = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  if (!name || !email || !password) {
    throw new Error('All fields are required');
  }

  // Preferred contract endpoint
  try {
    const response = await request<{
      user: { id: string; name: string; email: string };
      accessToken: string;
    }>(`${BASE_URL}/auth/register`, {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ name, email, password }),
    });

    return {
      token: response.accessToken,
      user: response.user,
    };
  } catch {
    // Fallback for JSON Server mock using /users
    const existingUsers = await request<any[]>(
      `${BASE_URL}/users?email=${email}`,
      { skipAuth: true },
    );

    if (existingUsers.length > 0) {
      throw new Error('Email already registered');
    }

    const token = generateToken();
    const user = await request<any>(`${BASE_URL}/users`, {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        name,
        email,
        password,
        token,
      }),
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
};

/* ======================= */
/* LOGIN */
/* ======================= */
export const loginApi = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Preferred contract endpoint
  try {
    const response = await request<{
      user: { id: string; name: string; email: string };
      accessToken: string;
    }>(`${BASE_URL}/auth/login`, {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });

    return {
      token: response.accessToken,
      user: response.user,
    };
  } catch {
    // Fallback for JSON Server mock using /users
    const users = await request<any[]>(
      `${BASE_URL}/users?email=${email}&password=${password}`,
      { skipAuth: true },
    );
    debugLog(email);
    if (users.length === 0) {
      throw new Error('Email or password incorrect');
    }

    const user = users[0];
    const newToken = generateToken();

    await request(`${BASE_URL}/users/${user.id}`, {
      method: 'PATCH',
      skipAuth: true,
      body: JSON.stringify({ token: newToken }),
    });

    return {
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
};
