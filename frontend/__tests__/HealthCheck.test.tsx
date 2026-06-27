import { render, screen, waitFor } from '@testing-library/react';
import HealthCheck from '@/components/HealthCheck';

describe('HealthCheck Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<HealthCheck />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('renders success state when backend is reachable', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
    render(<HealthCheck />);
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('renders error state when backend is unreachable', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(<HealthCheck />);
    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });
});
