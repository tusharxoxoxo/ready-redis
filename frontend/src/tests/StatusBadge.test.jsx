/**
 * Tests for StatusBadge and ChannelBadge components.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, ChannelBadge } from '../components/StatusBadge';

describe('StatusBadge', () => {
    it('renders "sent" badge with correct text and class', () => {
        const { container } = render(<StatusBadge status="sent" />);
        expect(screen.getByText(/sent/i)).toBeInTheDocument();
        expect(container.firstChild).toHaveClass('badge-sent');
    });

    it('renders "failed" badge', () => {
        const { container } = render(<StatusBadge status="failed" />);
        expect(screen.getByText(/failed/i)).toBeInTheDocument();
        expect(container.firstChild).toHaveClass('badge-failed');
    });

    it('renders "queued" badge', () => {
        render(<StatusBadge status="queued" />);
        expect(screen.getByText(/queued/i)).toBeInTheDocument();
    });

    it('renders "processing" badge', () => {
        render(<StatusBadge status="processing" />);
        expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    it('renders "scheduled" badge', () => {
        render(<StatusBadge status="scheduled" />);
        expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
    });

    it('renders "pending" badge', () => {
        render(<StatusBadge status="pending" />);
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it('renders unknown status without crashing', () => {
        render(<StatusBadge status="unknown" />);
        // Should render, just with no special class
        const badge = document.querySelector('.badge');
        expect(badge).toBeInTheDocument();
    });
});

describe('ChannelBadge', () => {
    it('renders email channel badge', () => {
        const { container } = render(<ChannelBadge channel="email" />);
        expect(screen.getByText(/email/i)).toBeInTheDocument();
        expect(container.firstChild).toHaveClass('badge-email');
    });

    it('renders sms channel badge', () => {
        render(<ChannelBadge channel="sms" />);
        expect(screen.getByText(/sms/i)).toBeInTheDocument();
    });

    it('renders push channel badge', () => {
        render(<ChannelBadge channel="push" />);
        expect(screen.getByText(/push/i)).toBeInTheDocument();
    });
});
