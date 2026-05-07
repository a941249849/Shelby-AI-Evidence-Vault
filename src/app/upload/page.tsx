'use client';

import { useState } from 'react';
import PageHeader from '@/components/page-header';

type Category = 'dataset' | 'agent-run' | 'document' | 'manifest';
type SourceType = 'web-scrape' | 'api-export' | 'agent-output' | 'manual-upload';

interface FormState {
  title: string;
  category: Category;
  sourceType: SourceType;
  tags: string;
  description: string;
}

export default function UploadPage() {
  const [form, setForm] = useState<FormState>({
    title: '',
    category: 'dataset',
    sourceType: 'manual-upload',
    tags: '',
    description: '',
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader
        title="Upload Evidence Pack"
        subtitle="Package your dataset, agent output, or document with metadata and send it to Shelby testnet."
      />

      {/* M0 info banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-8">
        <span className="text-amber-500 mt-0.5 flex-shrink-0">ℹ️</span>
        <p>
          <strong>M0 Demo:</strong> Upload is mocked. Real Shelby testnet integration coming in M1.
          No files will be stored.
        </p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Pack title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
            Pack title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Common Crawl Sample — Web Text 2024-Q1"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="dataset">Dataset</option>
            <option value="agent-run">Agent Run</option>
            <option value="document">Document</option>
            <option value="manifest">Manifest</option>
          </select>
        </div>

        {/* Source type */}
        <div>
          <label htmlFor="sourceType" className="block text-sm font-medium text-slate-700 mb-1">
            Source type
          </label>
          <select
            id="sourceType"
            name="sourceType"
            value={form.sourceType}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="web-scrape">Web Scrape</option>
            <option value="api-export">API Export</option>
            <option value="agent-output">Agent Output</option>
            <option value="manual-upload">Manual Upload</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
            Tags{' '}
            <span className="text-slate-400 font-normal text-xs">(comma-separated)</span>
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={form.tags}
            onChange={handleChange}
            placeholder="e.g. nlp, training-data, 2024"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the contents, source, and intended use of this evidence pack."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        </div>

        {/* File drop area */}
        <div>
          <p className="block text-sm font-medium text-slate-700 mb-1">Files</p>
          <div className="border-2 border-dashed border-slate-300 rounded-lg px-6 py-10 text-center bg-slate-50">
            <p className="text-slate-400 text-sm">
              Drag and drop files here — M0 placeholder
            </p>
            <p className="text-slate-300 text-xs mt-1">
              Real file upload coming in M1 with Shelby testnet integration
            </p>
          </div>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled
            title="Real upload coming in M1"
            className="w-full bg-indigo-400 text-white font-semibold py-2.5 px-4 rounded-lg text-sm cursor-not-allowed opacity-60"
          >
            Upload to Shelby Testnet
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Disabled in M0 — real upload coming in M1
          </p>
        </div>
      </form>
    </div>
  );
}
