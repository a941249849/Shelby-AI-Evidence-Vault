import Badge from './badge';
import type { EvidencePack } from '@/lib/evidence/types';

interface StatusBadgeProps {
  status: EvidencePack['status'];
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const variantMap: Record<EvidencePack['status'], 'success' | 'default' | 'warning'> = {
    active: 'success',
    archived: 'default',
    pending: 'warning',
  };
  return <Badge label={status} variant={variantMap[status]} />;
}
