import { useState } from 'react';

type FormFieldProps = {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function FormField({ label, error, required, children, className = '' }: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const showError = touched && error;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div
        onBlur={() => setTouched(true)}
        className={showError ? 'has-error' : ''}
      >
        {children}
      </div>
      {showError && (
        <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
