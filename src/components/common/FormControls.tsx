import type {
  ReactNode,
  SelectHTMLAttributes,
  InputHTMLAttributes,
} from "react";

interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  options: SelectOption[];
}

export const FormSelect = ({
  label,
  options,
  className = "",
  ...props
}: FormSelectProps) => (
  <div>
    {label && (
      <label className="block font-medium text-slate-700 mb-1">{label}</label>
    )}
    <select
      className={`w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer ${className}`}
      {...props}
    >
      {options.map((opt, idx) => (
        <option key={idx} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
}

export const FormInput = ({
  label,
  className = "",
  ...props
}: FormInputProps) => (
  <div>
    {label && (
      <label className="block font-medium text-slate-700 mb-1">{label}</label>
    )}
    <input
      className={`w-full border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none ${className}`}
      {...props}
    />
  </div>
);
