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
  /** Indicates the origin of this record. Undefined means built-in demo data. */
  dataSource?: 'demo' | 'local';
  /** The adapter mode used when this blob was registered. */
  uploadMode?: 'mock' | 'testnet';
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
    hash: 'sha256:b4e5f0a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
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
    hash: 'sha256:c5f6a1b2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
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
    hash: 'sha256:d6a7b8c9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7',
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
    hash: 'sha256:e7b8c9d0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8',
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
    hash: 'sha256:f8c9d0e1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
    source: 'agent://pipeline/synthetic-qa-gen/v1/output.jsonl',
    tags: ['jsonl', 'synthetic', 'qa', 'benchmark'],
    evidencePackId: 'pack-005',
    createdAt: '2024-03-18T16:00:00Z',
    size: 8388608,
    mimeType: 'application/jsonlines',
  },
];
