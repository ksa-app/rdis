'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Candidate } from '@/types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    passport_no: '',
    email: '',
    phone: '',
    status: 'new' as const,
  });

  useEffect(() => {
    const initPage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Get organization
        const { data: memberships } = await supabase
          .from('memberships')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .limit(1);

        if (!memberships?.[0]) {
          router.push('/dashboard');
          return;
        }

        const orgId = memberships[0].organization_id;
        const { data: orgs } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();

        setOrg(orgs);

        // Fetch candidates
        const { data } = await supabase
          .from('candidates')
          .select('*')
          .eq('organization_id', orgId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        setCandidates(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;

    try {
      if (editingId) {
        // Update
        await supabase
          .from('candidates')
          .update({
            name: form.name,
            passport_no: form.passport_no,
            email: form.email,
            phone: form.phone,
            status: form.status,
          })
          .eq('id', editingId);
      } else {
        // Create
        await supabase.from('candidates').insert({
          organization_id: org.id,
          name: form.name,
          passport_no: form.passport_no,
          email: form.email,
          phone: form.phone,
          status: form.status,
        });
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ name: '', passport_no: '', email: '', phone: '', status: 'new' });

      // Refresh candidates
      const { data } = await supabase
        .from('candidates')
        .select('*')
        .eq('organization_id', org.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      setCandidates(data || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save candidate');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      await supabase
        .from('candidates')
        .update({ is_deleted: true })
        .eq('id', id);

      setCandidates(candidates.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete candidate');
    }
  };

  const handleEdit = (candidate: Candidate) => {
    setEditingId(candidate.id);
    setForm({
      name: candidate.name,
      passport_no: candidate.passport_no,
      email: candidate.email || '',
      phone: candidate.phone || '',
      status: candidate.status as any,
    });
    setShowModal(true);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!org) return <div className="p-8">Organization not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
            <p className="text-gray-600">Manage your candidate database</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: '', passport_no: '', email: '', phone: '', status: 'new' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Candidate
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {candidates.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">No candidates yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Passport</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Email</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{candidate.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.passport_no}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        candidate.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        candidate.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        candidate.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(candidate)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Candidate' : 'Add Candidate'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport No. *
                </label>
                <input
                  type="text"
                  required
                  value={form.passport_no}
                  onChange={(e) => setForm({ ...form, passport_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="new">New</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
