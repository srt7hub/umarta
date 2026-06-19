import { STATUS_LABELS } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const isConfirmed = status === "CONFIRMED";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isConfirmed
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isConfirmed ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      aria-hidden
    />
  );
}
