export interface BlobRecord {
  id: string;
  shelbyRef: string;
  hash: string;
  source: string;
  tags: string[];
  evidencePackId: string;
  createdAt: string;
  size: number;
  mimeType: string;
}

export const blobs: BlobRecord[] = [
  {
    id: 'blob-001',
    shelbyRef: 'shelby://testnet/blob/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    hash: 'sha256:3b4c9e2f1a8d7c6b5e4f3a2b1c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1',
    source: 'https://commoncrawl.s3.amazonaws.com/crawl-data/CC-MAIN-2024-04/warc.paths.gz',
    tags: ['common-crawl', 'warc', 'raw'],
    evidencePackId: 'pack-001',
    createdAt: '2024-01-15T08:30:00Z',
    size: 52428800,
    mimeType: 'application/warc',
  },
  {
    id: 'blob-002',
    shelbyRef: 'shelby://testnet/blob/b2c3d4e5f6a7b2c3d4e5f6a7b2c3d4e5',
    hash: 'sha256:4c5d0f3g2b9e8d7c6f5g4b3c2d1e0f9g8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3',
    source: 'https://commoncrawl.s3.amazonaws.com/crawl-data/CC-MAIN-2024-04/wet.paths.gz',
    tags: ['common-crawl', 'wet', 'text'],
    evidencePackId: 'pack-001',
    createdAt: '2024-01-15T09:15:00Z',
    size: 10485760,
    mimeType: 'text/plain',
  },
  {
    id: 'blob-003',
    shelbyRef: 'shelby://testnet/blob/c3d4e5f6a7b8c3d4e5f6a7b8c3d4e5f6',
    hash: 'sha256:5d6e1g4h3c0f9e8d7g6h5c4d3e2f1g0h9c8d7e6f5g4h3i2j1k0l9m8n7o6p5q4',
    source: 'agent://gpt-4o/run/legal-extractor-v0.3/output.json',
    tags: ['gpt-4o', 'legal', 'json-output'],
    evidencePackId: 'pack-002',
    createdAt: '2024-02-03T14:22:11Z',
    size: 2097152,
    mimeType: 'application/json',
  },
  {
    id: 'blob-004',
    shelbyRef: 'shelby://testnet/blob/d4e5f6a7b8c9d4e5f6a7b8c9d4e5f6a7',
    hash: 'sha256:6e7f2h5i4d1g0f9e8h7i6d5e4f3g2h1i0d9e8f7g6h5i4j3k2l1m0n9o8p7q6r5',
    source: 'https://export.arxiv.org/oai2?verb=ListRecords&metadataPrefix=arXiv&set=cs.LG',
    tags: ['arxiv', 'oai-pmh', 'xml'],
    evidencePackId: 'pack-003',
    createdAt: '2024-02-10T09:00:00Z',
    size: 4194304,
    mimeType: 'application/xml',
  },
  {
    id: 'blob-005',
    shelbyRef: 'shelby://testnet/blob/e5f6a7b8c9d0e5f6a7b8c9d0e5f6a7b8',
    hash: 'sha256:7f8g3i6j5e2h1g0f9i8j7e6f5g4h3i2j1e0f9g8h7i6j5k4l3m2n1o0p9q8r7s6',
    source: 'internal://documents/policy/data-governance-v2.pdf',
    tags: ['pdf', 'policy', 'governance'],
    evidencePackId: 'pack-004',
    createdAt: '2024-03-01T11:45:00Z',
    size: 524288,
    mimeType: 'application/pdf',
  },
  {
    id: 'blob-006',
    shelbyRef: 'shelby://testnet/blob/f6a7b8c9d0e1f6a7b8c9d0e1f6a7b8c9',
    hash: 'sha256:8g9h4j7k6f3i2h1g0j9k8f7g6h5i4j3k2f1g0h9i8j7k6l5m4n3o2p1q0r9s8t7',
    source: 'agent://pipeline/synthetic-qa-gen/v1/output.jsonl',
    tags: ['jsonl', 'synthetic', 'qa', 'benchmark'],
    evidencePackId: 'pack-005',
    createdAt: '2024-03-18T16:00:00Z',
    size: 8388608,
    mimeType: 'application/jsonlines',
  },
];
