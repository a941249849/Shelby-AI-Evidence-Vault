interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'border-white/12 bg-white/[0.055] text-[#c7c1b8]',
  success: 'border-[#9fe878]/40 bg-[#9fe878]/12 text-[#9fe878]',
  warning: 'border-[#fd8565]/45 bg-[#fd8565]/12 text-[#ffc2ad]',
  error: 'border-[#ff6b7a]/45 bg-[#ff6b7a]/12 text-[#ffadb5]',
  info: 'border-[#de8aff]/38 bg-[#de8aff]/12 text-[#e7b6ff]',
};

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-xs font-semibold uppercase ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}
