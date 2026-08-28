import {
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
} from "react";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  options: SelectOption[];
  error?: string;
}

export const FormSelect = ({
  label,
  options = [],
  error,
  className = "",
  id,
  ...props
}: FormSelectProps) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block font-medium text-slate-700 mb-1 text-xs"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full border rounded-lg p-2 text-xs font-medium bg-white text-slate-700 focus:ring-2 focus:outline-none cursor-pointer transition-colors ${
          error
            ? "border-rose-400 focus:ring-rose-400"
            : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
        } ${className}`}
        {...props}
      >
        {options.map((opt, idx) => (
          <option
            key={`${opt.value}-${idx}`}
            value={opt.value}
            disabled={opt.disabled}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-[10px] font-medium text-rose-500">{error}</p>
      )}
    </div>
  );
};

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
}

export const FormInput = ({
  label,
  error,
  className = "",
  id,
  ...props
}: FormInputProps) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block font-medium text-slate-700 mb-1 text-xs"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full border rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-2 focus:outline-none transition-colors ${
          error
            ? "border-rose-400 focus:ring-rose-400"
            : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[10px] font-medium text-rose-500">{error}</p>
      )}
    </div>
  );
};
