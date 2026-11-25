// src/components/ui/Field.tsx
// Campo con etiqueta asociada (htmlFor/id), ayuda y error (spec 005, A8).
// No impone `name`: lo sigue pasando el formulario (C8).
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cx } from './cx';

const control =
  'w-full min-w-0 rounded-control border-[1.5px] border-line bg-surface px-4 text-base text-ink ' +
  'transition-colors focus:border-brand focus:outline-3 focus:outline-brand-soft focus:outline-offset-0 ' +
  'aria-invalid:border-danger disabled:bg-canvas disabled:text-muted';

export const inputClasses = cx(control, 'h-13');
export const textareaClasses = cx(control, 'min-h-28 py-3');

type FieldProps = {
  label: ReactNode;
  /** id del control. Si no se pasa, se genera uno. */
  id?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: (ctrl: {
    id: string;
    'aria-invalid': boolean | undefined;
    'aria-describedby': string | undefined;
    required: boolean | undefined;
  }) => ReactNode;
};

/** Envoltura de campo. Recibe una función que pinta el control con los
 *  atributos de accesibilidad ya resueltos:
 *
 *  <Field label="DUI" error={err}>{(a) => <Input name="madre_dui" {...a} />}</Field>
 */
export function Field({ label, id, hint, error, required, className, children }: FieldProps) {
  const auto = useId();
  const ctrlId = id ?? auto;
  const hintId = hint ? `${ctrlId}-ayuda` : undefined;
  const errorId = error ? `${ctrlId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={ctrlId} className="text-sm font-bold text-ink">
        {label}
      </label>
      {children({
        id: ctrlId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        required,
      })}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-[13px] font-bold text-danger">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
            className="mt-px flex-none"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.5" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cx(inputClasses, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cx(inputClasses, 'pr-10', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cx(textareaClasses, className)} {...props} />;
}
