import { render, screen } from '@testing-library/react';
import Page from '@/app/page';

jest.mock('@/components/HealthCheck', () => {
  return function DummyHealthCheck() {
    return <div data-testid="health-check-mock">Health Check Mock</div>;
  };
});

describe('Home Page', () => {
  it('renders the welcome heading', () => {
    render(<Page />);
    const heading = screen.getByRole('heading', { name: /Welcome to Lete/i });
    expect(heading).toBeInTheDocument();
  });
  
  it('renders the health check component', () => {
    render(<Page />);
    expect(screen.getByTestId('health-check-mock')).toBeInTheDocument();
  });
});
