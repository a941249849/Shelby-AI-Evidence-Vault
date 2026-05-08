import ReadReceiptClient from '@/components/read-receipt-client';

interface ReadReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReadReceiptPage({ params }: ReadReceiptPageProps) {
  const { id } = await params;
  return <ReadReceiptClient id={id} />;
}
