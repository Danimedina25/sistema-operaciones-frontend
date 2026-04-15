import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authStorage } from '@/modules/auth/services/auth-storage';
import type { AuthResponse, AuthUser, RoleName } from '@/modules/auth/types/auth.types';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => void;
  hasRole: (roles: RoleName | RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthResponseToUser(authData: AuthResponse): AuthUser {
  return {
    userId: authData.userId,
    correo: authData.correo,
    nombre: authData.nombre,
    roles: authData.roles,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    authStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((authData: AuthResponse) => {
    const mappedUser = mapAuthResponseToUser(authData);

    authStorage.setToken(authData.token);
    authStorage.setUser(mappedUser);

    setToken(authData.token);
    setUser(mappedUser);
  }, []);

  useEffect(() => {
    const storedToken = authStorage.getToken();
    const storedUser = authStorage.getUser();

    if (!storedToken || !storedUser) {
      authStorage.clear();
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const hasRole = useCallback(
    (roles: RoleName | RoleName[]) => {
        if (!user) return false;

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        return allowedRoles.some((role) => user.roles.includes(role));
    },
    [user],
    );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
      hasRole,
    }),
    [token, user, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}

