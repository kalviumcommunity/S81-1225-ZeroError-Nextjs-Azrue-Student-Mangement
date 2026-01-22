/**
 * Component tests for Button component
 * Demonstrates React Testing Library best practices
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../src/components/Button';

describe('Button Component', () => {
  test('renders button with correct label', () => {
    render(<Button label="Click Me" />);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Test Button" onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClick handler with userEvent.click', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button label="Test Button" onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders with primary variant by default', () => {
    render(<Button label="Primary" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-500');
  });

  test('renders with secondary variant when specified', () => {
    render(<Button label="Secondary" variant="secondary" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-300');
  });

  test('disables button when disabled prop is true', () => {
    render(<Button label="Disabled" disabled={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('does not call onClick when button is disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button label="Disabled" disabled={true} onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('renders with correct test id', () => {
    render(<Button label="Test" />);
    const button = screen.getByTestId('custom-button');
    expect(button).toBeInTheDocument();
  });
});
