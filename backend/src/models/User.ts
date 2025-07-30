export interface User {
  id: string;
  email: string;
  password_hash: string;
  wallet_id: string; 
  created_at: Date;
  updated_at: Date;
}

export interface RegisterRequest {
  email: string;                
  password: string;             
}

export interface LoginRequest {
  email: string;                
  password: string;             
}

export interface AuthResponse {
  success: boolean;             
  message: string;
  data?: {
    user: Omit<User, 'password_hash'>;  
    token: string;              
  };
}