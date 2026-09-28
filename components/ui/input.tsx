import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * DESIGN.md: surface or bg fill, 1px border, radius 10, height 44-52.
 * Links and URLs are set in Geist Mono.
 *
 * Every input needs a label. Pass `label` for a visible one, or `aria-label`
 * when the surrounding UI already names the field.
 */
// The native `size` attribute is a character count; ours is a height
// variant, so the native one is omitted rather than shadowed.
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visible label, rendered above the field and wired up by id. */
  label?: string
  /** 52px instead of 44px. */
  size?: 'default' | 'lg'
  /** Geist Mono — for links, URLs and meeting IDs. */
  mono?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, size = 'default', mono = false, className, id, ...props },
  ref
) {
  const field = (
    <input
      ref={ref}
      id={id}
      className={cn(
        'w-full rounded-control border border-border bg-surface px-4',
        'text-text placeholder:text-faint',
        'transition-[border-color] duration-fast ease-out-design',
        'hover:border-border-strong',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'lg' ? 'h-input-lg' : 'h-input',
        mono && 'font-mono',
        className
      )}
      {...props}
    />
  )

  if (!label) return field

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label-sm uppercase text-faint">
        {label}
      </label>
      {field}
    </div>
  )
})
