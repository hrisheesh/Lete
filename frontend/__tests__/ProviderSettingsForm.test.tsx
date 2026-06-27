import { render, screen, fireEvent } from '@testing-library/react';
import ProviderSettingsForm from '../components/ProviderSettingsForm';
import '@testing-library/jest-dom';

describe('ProviderSettingsForm', () => {
  it('renders the form with default provider (OpenAI)', () => {
    render(<ProviderSettingsForm />);
    
    expect(screen.getByText('AI Provider')).toBeInTheDocument();
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('openai');
  });

  it('shows appropriate placeholders and fields for Local provider', () => {
    render(<ProviderSettingsForm />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'local' } });
    
    expect(select).toHaveValue('local');
    
    const baseUrlInput = screen.getByPlaceholderText('http://localhost:11434/v1');
    expect(baseUrlInput).toBeInTheDocument();
  });
});
