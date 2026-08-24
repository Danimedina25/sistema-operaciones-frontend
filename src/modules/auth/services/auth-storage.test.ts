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

  it('guarda la sesión en el almacenamiento compartido entre pestañas', () => {
    authStorage.setToken('token-compartido');
    authStorage.setUser(user);

    expect(localStorage.getItem('auth_token')).toBe('token-compartido');
    expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(user));
    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(sessionStorage.getItem('auth_user')).toBeNull();
  });

  it('migra una sesión anterior desde sessionStorage', () => {
    sessionStorage.setItem('auth_token', 'token-anterior');
    sessionStorage.setItem('auth_user', JSON.stringify(user));

    expect(authStorage.getToken()).toBe('token-anterior');
    expect(authStorage.getUser()).toEqual(user);
    expect(localStorage.getItem('auth_token')).toBe('token-anterior');
    expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(user));
  });
});
