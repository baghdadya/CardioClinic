import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10",
        destructive: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/10",
        outline: "bg-white text-slate-600 ring-1 ring-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
export type { BadgeProps };
