import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * DESIGN.md:
 * - Primary:   accent fill, accent-ink text, 600 weight, height 44-48, radius 10.
 *              One per view where possible.
 * - Secondary: transparent, 1px border-strong, text, 500 weight, same metrics.
 * - Joined:    the active state — accent-bg-2 fill, accent text, pulsing dot.
 *
 * Focus comes from the global :focus-visible rule in globals.css (2px accent
 * outline, 2px offset), so it is not repeated per variant.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'joined'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink font-semibold hover:brightness-95',
  secondary: 'bg-transparent border border-border-strong text-text font-medium hover:bg-surface-hover',
  joined: 'bg-accent-bg-2 text-accent font-medium border border-accent-border',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** 48px instead of 44px, for the landing page's primary calls to action. */
  size?: 'default' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'default', className, children, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control px-5',
        'transition-[background-color,color,opacity] duration-fast ease-out-design',
        'disabled:pointer-events-none disabled:opacity-50',
        size === 'lg' ? 'h-control-lg' : 'h-control',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {/* DESIGN.md: the joined/active state carries a pulsing dot. */}
      {variant === 'joined' && <StatusDot />}
      {children}
    </button>
  )
})

/**
 * DESIGN.md: 6-10px circle, accent, pulses when live. `rounded-full` is the
 * one place 999px radius is allowed.
 */
export function StatusDot({ className, live = true }: { className?: string; live?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'h-2 w-2 shrink-0 rounded-full bg-accent',
        live && 'motion-safe:animate-pulse-dot',
        className
      )}
    />
  )
}
