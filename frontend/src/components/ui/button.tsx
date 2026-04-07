import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-semibold",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer select-none",
    "rounded-xl",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white",
          "shadow-md shadow-indigo-500/20",
          "hover:from-indigo-500 hover:to-indigo-400 hover:shadow-lg hover:shadow-indigo-500/30",
          "active:scale-[0.98] active:shadow-sm",
        ],
        secondary: [
          "bg-white text-slate-700",
          "shadow-sm shadow-black/5",
          "ring-1 ring-slate-200",
          "hover:bg-slate-50 hover:ring-slate-300",
          "active:scale-[0.98]",
        ],
        destructive: [
          "bg-gradient-to-r from-rose-600 to-rose-500 text-white",
          "shadow-md shadow-rose-500/20",
          "hover:from-rose-500 hover:to-rose-400 hover:shadow-lg hover:shadow-rose-500/30",
          "active:scale-[0.98] active:shadow-sm",
        ],
        ghost: [
          "text-slate-600",
          "hover:bg-slate-100 hover:text-slate-900",
          "active:scale-[0.98]",
        ],
        outline: [
          "border-2 border-indigo-200 text-indigo-600 bg-transparent",
          "hover:bg-indigo-50 hover:border-indigo-300",
          "active:scale-[0.98]",
        ],
      },
      size: {
        sm: "h-8 px-3.5 text-sm rounded-lg",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
