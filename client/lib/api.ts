import axios from 'axios';

const API_BASE = 'http://localhost:3001';

// export const apiClient = axios.create({

//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add auth token to requests
// apiClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem('auth_token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Handle auth errors
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('auth_token');
//       window.location.href = '/auth';
//     }
//     return Promise.reject(error);
//   }
// );

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      wallet_id: string;
      created_at: string;
      updated_at: string;
    };
    token: string;
  };
}

export interface WalletResponse {
  success: boolean;
  message: string;
  data?: {
    wallet_id: string;
    total_chains: number;
    total_tokens: number;
    total_usd_value: string;
    chains: Array<{
      chain_id: number;
      chain_name: string;
      chain_symbol: string;
      token_count: number;
      total_usd_value: string;
      tokens: Array<{
        address: string;
        symbol: string;
        name: string;
        balance: string;
        usd_value: string;
        logo_uri?: string;
      }>;
    }>;
  };
}

class ApiClient {
  private getHeaders(token?: string) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  async post<T>(endpoint: string, data: any, token?: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    console.log(`${API_BASE}${endpoint}`);
    
    return response.json();
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: this.getHeaders(token),
    });
    
    return response.json();
  }
  async register(email: string, password: string): Promise<AuthResponse> {
    return this.post('/api/auth/register', { email, password });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.post('/api/auth/login', { email, password });
  }

  async getProfile(token: string): Promise<AuthResponse> {
    return this.get('/api/auth/profile-with-wallet', token);
  }

  // Wallet endpoints
  async getWallet(token: string): Promise<WalletResponse> {
    return this.get('/api/wallet/summary', token);
  }

  async getChainWallet(chainId: number, token: string): Promise<any> {
    return this.get(`/api/wallet/chain/${chainId}`, token);
  }
}

export const api = new ApiClient();
