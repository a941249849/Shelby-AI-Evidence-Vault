interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  warning: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  error: 'bg-red-950/60 text-red-400 border-red-800/60',
  info: 'bg-violet-950/60 text-violet-400 border-violet-800/60',
};

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}
