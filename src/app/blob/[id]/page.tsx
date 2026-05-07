import BlobDetailClient from '@/components/blob-detail-client';

interface BlobPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlobPage({ params }: BlobPageProps) {
  const { id } = await params;
  return <BlobDetailClient id={id} />;
}
