import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string, role: 'Owner' | 'Accountant') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { user: User; token: string } };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'RESTORE_SESSION':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

// Mock users for demo
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    email: 'owner@urbanit.com',
    password: 'password123',
    role: 'Owner',
    name: 'John Smith'
  },
  {
    id: '2',
    email: 'accountant@urbanit.com',
    password: 'password123',
    role: 'Accountant',
    name: 'Sarah Johnson'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Restore session from localStorage
    const token = localStorage.getItem('urbanit_token');
    const userData = localStorage.getItem('urbanit_user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch({ type: 'RESTORE_SESSION', payload: { user, token } });
      } catch (error) {
        localStorage.removeItem('urbanit_token');
        localStorage.removeItem('urbanit_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      const token = `mock_token_${user.id}_${Date.now()}`;
      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };
      
      localStorage.setItem('urbanit_token', token);
      localStorage.setItem('urbanit_user', JSON.stringify(userWithoutPassword));
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user: userWithoutPassword, token } 
      });
      
      return true;
    }
    
    return false;
  };

  const register = async (email: string, password: string, name: string, role: 'Owner' | 'Accountant'): Promise<boolean> => {
    // In a real app, this would call the API
    // For demo purposes, we'll just simulate success
    const newUser: User = {
      id: `${Date.now()}`,
      email,
      role,
      name
    };
    
    const token = `mock_token_${newUser.id}_${Date.now()}`;
    
    localStorage.setItem('urbanit_token', token);
    localStorage.setItem('urbanit_user', JSON.stringify(newUser));
    
    dispatch({ 
      type: 'LOGIN_SUCCESS', 
      payload: { user: newUser, token } 
    });
    
    return true;
  };

  const logout = () => {
    localStorage.removeItem('urbanit_token');
    localStorage.removeItem('urbanit_user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};