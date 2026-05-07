import { getEvidencePacks, getBlobsByPackId } from '@/lib/evidence/service';
import DashboardClient from '@/components/dashboard-client';

export const metadata = {
  title: 'Dashboard — Shelby AI Evidence Vault',
};

export default function DashboardPage() {
  const packs = getEvidencePacks();
  const blobs = packs.flatMap((p) => getBlobsByPackId(p.id));

  return <DashboardClient demoPacks={packs} demoBlobs={blobs} />;
}
