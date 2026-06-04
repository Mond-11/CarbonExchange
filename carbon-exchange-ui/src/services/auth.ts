import type { User } from '../types';

const API_BASE = 'http://localhost:8080/api/auth';

export const login = async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    const user = await response.json();
    localStorage.setItem('user', JSON.stringify(user));
    return user;
};

export const register = async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error('Registration failed');
    const user = await response.json();
    localStorage.setItem('user', JSON.stringify(user));
    return user;
};

export const logout = () => {
    localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
};

export const fetchAllUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
};

export const fetchUser = async (id: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/user/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
};
