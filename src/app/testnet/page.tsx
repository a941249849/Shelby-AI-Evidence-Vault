import { getShelbyModeAction } from '@/app/actions/upload';
import TestnetPageClient from '@/components/testnet-page-client';

export default async function TestnetPage() {
  const mode = await getShelbyModeAction();

  return <TestnetPageClient mode={mode} />;
}
