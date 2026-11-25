// src/components/ui/Button.tsx
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-extrabold ' +
  'transition-colors select-none disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover',
  secondary: 'border-[1.5px] border-line bg-surface text-brand hover:bg-canvas',
  danger: 'bg-danger text-on-brand hover:opacity-90',
  ghost: 'bg-transparent text-brand hover:bg-brand-soft',
};

// Alto mínimo 48 px (R4: áreas tocables de al menos 44 px)
const sizes: Record<ButtonSize, string> = {
  md: 'h-12 px-5 text-base',
  lg: 'h-13 px-6 text-base',
};

type Common = { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean };

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth }: Common = {}) {
  return cx(base, variants[variant], sizes[size], fullWidth && 'w-full');
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = 'button',
  ...props
}: Common & ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cx(buttonClasses({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={cx(buttonClasses({ variant, size, fullWidth }), className)} {...props} />
  );
}
