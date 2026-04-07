import { LayoutGrid, PanelLeft } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { layout, toggleLayout } = useThemeStore();

  const isClassic = layout === "classic";
  const label = isClassic ? "Switch to Modern layout" : "Switch to Classic layout";

  return (
    <button
      onClick={toggleLayout}
      title={label}
      aria-label={label}
      className={cn(
        "group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md",
        className
      )}
    >
      {isClassic ? <LayoutGrid size={18} /> : <PanelLeft size={18} />}
      {/* Tooltip */}
      <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
