import type { User } from '../types';

/**
 * Service for handling user authentication and profile retrieval.
 */
const API_BASE = 'http://localhost:8080/api/auth';

/**
 * Log in a user with username and password.
 * 
 * @param username the username
 * @param password the password
 * @returns a promise that resolves to the logged-in User
 */
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

/**
 * Register a new user with username and password.
 * 
 * @param username the username
 * @param password the password
 * @returns a promise that resolves to the registered User
 */
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

/**
 * Log out the current user by removing them from local storage.
 */
export const logout = () => {
    localStorage.removeItem('user');
};

/**
 * Retrieves the currently logged-in user from local storage.
 * 
 * @returns the User if logged in, null otherwise
 */
export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
};

/**
 * Fetches all registered users (used by the market maker bot).
 * 
 * @returns a promise that resolves to an array of Users
 */
export const fetchAllUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
};

/**
 * Fetches a specific user by their ID.
 * 
 * @param id the user UUID
 * @returns a promise that resolves to the User
 */
export const fetchUser = async (id: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/user/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
};
