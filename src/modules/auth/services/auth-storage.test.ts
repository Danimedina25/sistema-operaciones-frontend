import { beforeEach, describe, expect, it } from 'vitest';
import { authStorage } from './auth-storage';

const user = {
  userId: 7,
  correo: 'socio@example.com',
  nombre: 'Socio',
  roles: ['SOCIO_COMERCIAL' as const],
};

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('guarda una sesión temporal cuando Recordarme está desmarcado', () => {
    authStorage.setToken('token-temporal');
    authStorage.setUser(user);

    expect(sessionStorage.getItem('auth_token')).toBe('token-temporal');
    expect(sessionStorage.getItem('auth_user')).toBe(JSON.stringify(user));
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });

  it('guarda una sesión persistente al marcar Recordarme y limpia una sesión temporal previa', () => {
    authStorage.setToken('token-temporal');
    authStorage.setUser(user);
    authStorage.setToken('token-recordado', true);
    authStorage.setUser(user, true);

    expect(authStorage.getToken()).toBe('token-recordado');
    expect(authStorage.getUser()).toEqual(user);
    expect(localStorage.getItem('auth_token')).toBe('token-recordado');
    expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(user));
    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(sessionStorage.getItem('auth_user')).toBeNull();
  });

  it('limpia una sesión persistente al iniciar sesión sin Recordarme', () => {
    authStorage.setToken('token-recordado', true);
    authStorage.setUser(user, true);
    authStorage.setToken('token-temporal');
    authStorage.setUser(user);

    expect(authStorage.getToken()).toBe('token-temporal');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });
});
