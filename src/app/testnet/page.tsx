import { getShelbyModeAction } from '@/app/actions/upload';
import TestnetPageClient from '@/components/testnet-page-client';
import UploadProviders from '@/app/upload/providers';

export default async function TestnetPage() {
  const mode = await getShelbyModeAction();

  return (
    <UploadProviders>
      <TestnetPageClient mode={mode} />
    </UploadProviders>
  );
}
