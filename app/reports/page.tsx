'use client';

import { useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Coming soon</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BarChart3 size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports Coming Soon</h2>
          <p className="text-gray-600 mb-4">
            Advanced reporting and analytics will be available soon. For now, use the module pages to view your data.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <a href="/candidates" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              View Candidates
            </a>
            <a href="/team" className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400">
              View Team
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
