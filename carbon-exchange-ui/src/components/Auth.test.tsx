import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auth from './Auth';
import * as authService from '../services/auth';

vi.mock('../services/auth', () => ({
    login: vi.fn(),
    register: vi.fn(),
}));

describe('Auth Component', () => {
    const mockOnLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render login form by default', () => {
        render(<Auth onLogin={mockOnLogin} />);
        expect(screen.getByText('Login', { selector: 'h5' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /LOGIN/i })).toBeInTheDocument();
    });

    it('should switch to registration form', () => {
        render(<Auth onLogin={mockOnLogin} />);
        fireEvent.click(screen.getByText(/Create an account/i));
        expect(screen.getByText('Create Account')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /REGISTER/i })).toBeInTheDocument();
    });

    it('should call login service on submit', async () => {
        const mockUser = { id: '1', username: 'test' };
        vi.mocked(authService.login).mockResolvedValue(mockUser as any);

        render(<Auth onLogin={mockOnLogin} />);
        
        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'test' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /LOGIN/i }));

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith('test', 'password');
            expect(mockOnLogin).toHaveBeenCalledWith(mockUser);
        });
    });

    it('should show error message on login failure', async () => {
        vi.mocked(authService.login).mockRejectedValue(new Error('Failed'));

        render(<Auth onLogin={mockOnLogin} />);
        
        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'test' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /LOGIN/i }));

        await waitFor(() => {
            expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
        });
    });
});
