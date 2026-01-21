/**
 * Button component in src to be tested by RTL
 */
import React from 'react';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded font-semibold transition-colors';
  const variantStyles =
    variant === 'primary'
      ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300'
      : 'bg-gray-300 text-gray-800 hover:bg-gray-400 disabled:bg-gray-200';

  return (
    <button
      className={`${baseStyles} ${variantStyles}`}
      onClick={onClick}
      disabled={disabled}
      data-testid="custom-button"
    >
      {label}
    </button>
  );
}
