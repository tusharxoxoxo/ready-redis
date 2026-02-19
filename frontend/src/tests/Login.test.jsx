/**
 * Tests for the Login page — form rendering and interaction.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock auth context
const mockLogin = vi.fn();
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ login: mockLogin, token: null, user: null }),
    AuthProvider: ({ children }) => children,
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

import Login from '../pages/Login';

const renderLogin = () =>
    render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    );

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all form elements', () => {
        renderLogin();
        expect(screen.getByText('NotifyHub')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('admin')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows default credential hint', () => {
        renderLogin();
        // Both placeholder and code element contain 'admin' — use getAllByText
        const adminEls = screen.getAllByText(/admin/);
        expect(adminEls.length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('admin123')).toBeInTheDocument();
    });

    it('calls login with entered credentials on submit', async () => {
        mockLogin.mockResolvedValue('token-abc');
        const user = userEvent.setup();
        renderLogin();

        await user.type(screen.getByPlaceholderText('admin'), 'admin');
        await user.type(screen.getByPlaceholderText('••••••••'), 'admin123');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('admin', 'admin123');
        });
    });

    it('navigates to / after successful login', async () => {
        mockLogin.mockResolvedValue('token-abc');
        const user = userEvent.setup();
        renderLogin();

        await user.type(screen.getByPlaceholderText('admin'), 'admin');
        await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('displays error message on login failure', async () => {
        mockLogin.mockRejectedValue({
            response: { data: { detail: 'Incorrect username or password' } },
        });
        const user = userEvent.setup();
        renderLogin();

        await user.type(screen.getByPlaceholderText('admin'), 'admin');
        await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/incorrect username or password/i)).toBeInTheDocument();
        });
    });

    it('disables submit button while logging in', async () => {
        // Never resolves — stays in loading state
        mockLogin.mockImplementation(() => new Promise(() => { }));
        const user = userEvent.setup();
        renderLogin();

        await user.type(screen.getByPlaceholderText('admin'), 'admin');
        await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
        });
    });
});
