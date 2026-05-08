interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'border-[#2d211c]/12 bg-[#fff8ea] text-[#c7c1b8]',
  success: 'border-[#157a4c]/40 bg-[#dff2c8] text-[#157a4c]',
  warning: 'border-[#ef6f4d]/45 bg-[#ffe0cf] text-[#a33f2d]',
  error: 'border-[#ff6b7a]/45 bg-[#ff6b7a]/12 text-[#ffadb5]',
  info: 'border-[#6a3ea1]/38 bg-[#efe2ff] text-[#6a3ea1]',
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
