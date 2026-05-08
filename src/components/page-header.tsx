interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-[#f4f0e8]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[#9d9a92]">{subtitle}</p>}
    </div>
  );
}
