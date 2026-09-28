'use client'

import { cn } from '@/lib/utils'
import { i18nText, type LanguageCode } from '@/lib/i18n-text'

/**
 * DESIGN.md: container bg + border, radius 10, 4px padding; the selected
 * option takes an accent fill with accent-ink text. Used for the language
 * switcher, which is why option labels can render in their own script.
 *
 * Accessibility: real buttons in a group, each carrying aria-pressed, per
 * DESIGN.md's rule for toggle groups.
 */
export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Renders the label in its own script and direction. */
  lang?: LanguageCode
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Names the group for screen readers. */
  label: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-control border border-border bg-bg p-1',
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        const script = option.lang ? i18nText(option.lang) : null

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            dir={script?.dir}
            lang={script?.lang}
            className={cn(
              'rounded-chip px-3 py-1.5 text-small',
              'transition-[background-color,color] duration-base ease-out-design',
              script?.className,
              selected
                ? 'bg-accent font-semibold text-accent-ink'
                : 'text-muted hover:bg-surface-hover hover:text-text'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
