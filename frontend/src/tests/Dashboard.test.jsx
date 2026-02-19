/**
 * Tests for the Dashboard page — stat cards and channel bars.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock API module
vi.mock('../api/api', () => ({
    getStats: vi.fn(),
    default: {},
}));

// Mock auth context
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ token: 'fake-token', user: { username: 'admin' } }),
}));

import Dashboard from '../pages/Dashboard';
import { getStats } from '../api/api';

const MOCK_STATS = {
    total: 42,
    sent: 30,
    failed: 5,
    queued: 4,
    processing: 2,
    scheduled: 1,
    pending: 0,
    channels: { email: 20, sms: 15, push: 7 },
};

const renderDashboard = () =>
    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );

describe('Dashboard Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        getStats.mockImplementation(() => new Promise(() => { }));
        renderDashboard();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders stat cards with correct counts after load', async () => {
        getStats.mockResolvedValue({ data: MOCK_STATS });
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('42')).toBeInTheDocument(); // total
            expect(screen.getByText('30')).toBeInTheDocument(); // sent
            expect(screen.getByText('5')).toBeInTheDocument();  // failed
        });
    });

    it('renders page title', async () => {
        getStats.mockResolvedValue({ data: MOCK_STATS });
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });
    });

    it('renders channel distribution section', async () => {
        getStats.mockResolvedValue({ data: MOCK_STATS });
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/channel distribution/i)).toBeInTheDocument();
            expect(screen.getByText(/email/i)).toBeInTheDocument();
            expect(screen.getByText(/sms/i)).toBeInTheDocument();
            expect(screen.getByText(/push/i)).toBeInTheDocument();
        });
    });

    it('shows empty state link when no notifications', async () => {
        getStats.mockResolvedValue({
            data: {
                total: 0, sent: 0, failed: 0, queued: 0,
                processing: 0, scheduled: 0, pending: 0,
                channels: { email: 0, sms: 0, push: 0 },
            },
        });
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/send your first one/i)).toBeInTheDocument();
        });
    });

    it('shows refresh button', async () => {
        getStats.mockResolvedValue({ data: MOCK_STATS });
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
        });
    });
});
