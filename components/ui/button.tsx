import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The only button in the product. DESIGN.md gives two variants and four
 * states; anything a screen needs beyond that is a conversation about the
 * system, not a local override.
 *
 * Primary   #4ADE80 fill, #06210F text, 600
 * Secondary transparent, 1px #2E333A, #EDEFF2, 500
 *
 * Focus comes from the global :focus-visible rule in globals.css, so it is
 * never re-declared here.
 */
export type ButtonVariant = 'primary' | 'secondary'

/**
 * `nav` is the one sanctioned departure from 44/10/14: a 44px control inside
 * the 72px navbar leaves too little room above and below, and the reference
 * canvas draws navbar buttons smaller. Named, so it can't spread by accident.
 */
export type ButtonSize = 'default' | 'lg' | 'nav'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink font-semibold hover:brightness-95',
  secondary:
    'bg-transparent border border-border-strong text-text font-medium hover:bg-surface-hover',
}

/**
 * Disabled is not just reduced opacity on primary: DESIGN.md gives it its own
 * fill so a disabled primary doesn't read as a washed-out live one.
 */
const DISABLED: Record<ButtonVariant, string> = {
  primary: 'disabled:bg-accent-disabled disabled:text-accent/50 disabled:hover:brightness-100',
  secondary: 'disabled:opacity-50 disabled:hover:bg-transparent',
}

const SIZES: Record<ButtonSize, string> = {
  default: 'h-control rounded-control px-5 text-[14px]',
  lg: 'h-control-lg rounded-control px-7 text-[15px]',
  nav: 'h-nav-control rounded-nav-control px-4 text-[13px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /**
   * Shows the spinner and blocks interaction. Loading implies disabled — a
   * button that is working must not accept a second click.
   */
  loading?: boolean
}

/**
 * The shared class list. Exported so ButtonLink can render an anchor that is
 * byte-for-byte the same button, instead of a copy that drifts.
 */
export function buttonClasses({
  variant = 'secondary',
  size = 'default',
  loading = false,
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  className?: string
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'transition-[background-color,color,opacity] duration-fast ease-out-design',
    'disabled:pointer-events-none disabled:cursor-not-allowed',
    loading && 'cursor-default',
    SIZES[size],
    VARIANTS[variant],
    DISABLED[variant],
    className
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'default',
    loading = false,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      // Pointer events off so a disabled control cannot be clicked at all,
      // not merely styled as if it couldn't.
      className={buttonClasses({ variant, size, loading, className })}
      {...props}
    >
      {loading && <Spinner variant={variant} />}
      {children}
    </button>
  )
})

/**
 * A 14px ring in the button's own text colour at one-third alpha, with a
 * solid top edge so the rotation reads. Drawn in the button's colour rather
 * than a fixed one, so it works on both fills.
 */
function Spinner({ variant }: { variant: ButtonVariant }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'h-3.5 w-3.5 shrink-0 rounded-full border-2 motion-safe:animate-spin',
        variant === 'primary'
          ? 'border-accent-ink/30 border-t-accent-ink'
          : 'border-text/30 border-t-text'
      )}
    />
  )
}

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


/**
 * A link that looks exactly like a button. Navigation is an anchor, not a
 * button with an onClick — it must open in a new tab, be copyable, and be
 * announced as a link.
 */
export const ButtonLink = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
    variant?: ButtonVariant
    size?: ButtonSize
  }
>(function ButtonLink({ href, variant = 'secondary', size = 'default', className, ...props }, ref) {
  const classes = buttonClasses({ variant, size, className })
  // next/link handles internal routes; an external or hash-only href is a
  // plain anchor, which is what those should be.
  if (href.startsWith('http') || href.startsWith('#')) {
    return <a ref={ref} href={href} className={classes} {...props} />
  }
  return <Link ref={ref} href={href} className={classes} {...props} />
})
