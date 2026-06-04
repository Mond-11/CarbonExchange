import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, register, logout, getCurrentUser, fetchAllUsers } from './auth';

describe('Auth Service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('should login and save user to localStorage', async () => {
        const mockUser = { id: '1', username: 'test', moneyBalance: 1000, creditBalance: 100 };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockUser),
        }));

        const user = await login('test', 'password');

        expect(user).toEqual(mockUser);
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should register and save user to localStorage', async () => {
        const mockUser = { id: '1', username: 'test', moneyBalance: 1000, creditBalance: 100 };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockUser),
        }));

        const user = await register('test', 'password');

        expect(user).toEqual(mockUser);
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should logout and remove user from localStorage', () => {
        localStorage.setItem('user', JSON.stringify({ id: '1' }));
        logout();
        expect(localStorage.getItem('user')).toBeNull();
    });

    it('should get current user from localStorage', () => {
        const mockUser = { id: '1', username: 'test' };
        localStorage.setItem('user', JSON.stringify(mockUser));
        expect(getCurrentUser()).toEqual(mockUser);
    });

    it('should fetch all users', async () => {
        const mockUsers = [{ id: '1' }, { id: '2' }];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockUsers),
        }));

        const users = await fetchAllUsers();
        expect(users).toEqual(mockUsers);
    });
});
