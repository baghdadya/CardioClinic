import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, iconLeft, iconRight, id, type = "text", ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-slate-400">
              {iconLeft}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-xl bg-white px-4 py-2.5 text-sm text-slate-800",
              "ring-1 ring-slate-200",
              "transition-all duration-200",
              "placeholder:text-slate-400",
              "focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:outline-none",
              "hover:ring-slate-300",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
              iconLeft && "ps-10",
              iconRight && "pe-10",
              error && "ring-rose-300 focus:ring-rose-500/30",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {iconRight && (
            <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3.5 text-slate-400">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-rose-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
export type { InputProps };
