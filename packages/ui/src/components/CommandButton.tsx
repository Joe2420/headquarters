import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface CommandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'guardian' | 'danger';
}

export function CommandButton({ children, variant = 'primary', ...props }: CommandButtonProps) {
  return (
    <button data-variant={variant} {...props}>
      {children}
    </button>
  );
}
