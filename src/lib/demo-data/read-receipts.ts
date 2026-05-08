export interface ReadReceipt {
  id: string;
  runId: string;
  query: string;
  answerSummary: string;
  referencedBlobIds: string[];
  evidencePackIds: string[];
  timestamp: string;
  agentVersion: string;
  /**
   * Identifies the origin of the receipt.
   * Undefined means built-in demo data (backward compatible).
   * 'demo'            — built-in illustrative data.
   * 'local'           — created after a browser-local mock upload.
   * 'shelby-testnet'  — created after a real Shelby testnet upload.
   */
  receiptMode?: 'demo' | 'local' | 'shelby-testnet';
}

export const readReceipts: ReadReceipt[] = [
  {
    id: 'rr-001',
    runId: 'run-2024-02-03-legal-extractor-001',
    query:
      'Extract all indemnification clauses from the uploaded SaaS contracts and return structured JSON.',
    answerSummary:
      'Successfully extracted 147 indemnification clauses from 200 contracts. 12 contracts had no indemnification clause. Average clause length: 312 words. Top 3 clause patterns identified: mutual indemnification (62%), customer-only indemnification (28%), vendor-only indemnification (10%).',
    referencedBlobIds: ['blob-003'],
    evidencePackIds: ['pack-002'],
    timestamp: '2024-02-03T14:22:11Z',
    agentVersion: 'shelby-agent/0.3.0 gpt-4o-2024-01-25',
  },
  {
    id: 'rr-002',
    runId: 'run-2024-02-10-arxiv-query-001',
    query:
      'Summarize the top 10 most-cited machine learning papers published on arXiv in February 2024, focusing on LLM alignment and RLHF.',
    answerSummary:
      'Retrieved 3,200 paper metadata records. Filtered to 84 papers matching LLM alignment and RLHF criteria. Top cited paper: "Constitutional AI: Harmlessness from AI Feedback" with 412 citations. Key themes: reward modeling (34%), preference learning (28%), red-teaming (22%), interpretability (16%).',
    referencedBlobIds: ['blob-004'],
    evidencePackIds: ['pack-003'],
    timestamp: '2024-02-10T10:30:00Z',
    agentVersion: 'shelby-agent/0.3.1 gpt-4o-2024-02-01',
  },
  {
    id: 'rr-003',
    runId: 'run-2024-03-01-policy-audit-001',
    query:
      'Review the data governance policy document and identify any gaps relative to EU AI Act requirements effective 2025.',
    answerSummary:
      'Reviewed 47-page policy document. Identified 6 compliance gaps: (1) Lack of high-risk AI system register, (2) No conformity assessment procedure, (3) Missing technical documentation template, (4) No post-market monitoring plan, (5) Insufficient human oversight provisions, (6) No fundamental rights impact assessment template.',
    referencedBlobIds: ['blob-005'],
    evidencePackIds: ['pack-004'],
    timestamp: '2024-03-01T13:00:00Z',
    agentVersion: 'shelby-agent/0.4.0 gpt-4o-2024-03-01',
  },
  {
    id: 'rr-004',
    runId: 'run-2024-03-20-benchmark-eval-001',
    query:
      'Run the synthetic QA benchmark against Llama-3-70B and GPT-4o, report accuracy by task category.',
    answerSummary:
      'Evaluated 10,000 QA examples across 2 models. GPT-4o overall accuracy: 87.3% (arithmetic: 94.1%, logical deduction: 85.2%, causal inference: 82.6%). Llama-3-70B overall accuracy: 79.8% (arithmetic: 89.3%, logical deduction: 76.4%, causal inference: 73.7%). GPT-4o outperformed on all categories.',
    referencedBlobIds: ['blob-006'],
    evidencePackIds: ['pack-005'],
    timestamp: '2024-03-20T18:45:00Z',
    agentVersion: 'shelby-agent/0.4.1 eval-harness/1.2.0',
  },
];
