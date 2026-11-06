import { cn } from '@/lib/utils'

export const inputClass =
  'w-full rounded-xl border border-input bg-white px-4 py-3 text-[15px] text-navy-900 placeholder:text-navy-300 transition focus:border-gold-400 focus:outline-none focus:ring-4 focus:ring-gold-200/50 disabled:bg-parchment disabled:text-muted-foreground aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-100'

type FieldProps = {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}

export function Field({ label, htmlFor, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className='block text-sm font-medium text-navy-800'>
        {label}
        {required && <span className='ml-0.5 text-gold-700'>*</span>}
      </label>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role='alert' className='text-sm text-red-600'>
          {error}
        </p>
      ) : hint ? (
        <p className='text-xs text-muted-foreground'>{hint}</p>
      ) : null}
    </div>
  )
}

type ChoiceProps = {
  name: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}

/** Segmented single-choice control rendered as accessible radio buttons. */
export function Choice({ name, value, options, onChange }: ChoiceProps) {
  return (
    <div role='radiogroup' className='flex flex-wrap gap-2'>
      {options.map((option) => {
        const checked = value === option
        return (
          <label
            key={option}
            className={cn(
              'cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gold-200',
              checked ? 'border-navy-900 bg-navy-900 text-white' : 'border-input bg-white text-navy-700 hover:border-navy-300',
            )}
          >
            <input type='radio' name={name} value={option} checked={checked} onChange={() => onChange(option)} className='sr-only' />
            {option}
          </label>
        )
      })}
    </div>
  )
}

type CheckboxCardProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  children: React.ReactNode
  error?: string
  id?: string
}

export function CheckboxCard({ checked, onChange, children, error, id }: CheckboxCardProps) {
  return (
    <div>
      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
          checked ? 'border-gold-300 bg-gold-50' : 'border-input bg-white hover:border-navy-200',
          error && 'border-red-300',
        )}
      >
        <input
          id={id}
          type='checkbox'
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className='mt-0.5 h-5 w-5 shrink-0 rounded border-navy-300 accent-navy-900'
        />
        <span className='text-sm leading-relaxed text-navy-800'>{children}</span>
      </label>
      {error && (
        <p role='alert' className='mt-1.5 text-sm text-red-600'>
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Hidden "website" field that real visitors never see or fill in. Send its
 * value with the form; the API silently drops submissions where it is set.
 */
export function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden='true' className='absolute -left-[9999px] h-px w-px overflow-hidden'>
      <label>
        Website
        <input type='text' name='website' tabIndex={-1} autoComplete='off' value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  )
}
