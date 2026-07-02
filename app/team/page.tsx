'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Shield } from 'lucide-react';

type Member = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  email?: string;
  full_name?: string;
};

const ROLES = ['owner', 'admin', 'manager', 'recruiter', 'medical_officer', 'accounts', 'data_entry', 'support', 'viewer'];

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'recruiter' });

  useEffect(() => {
    const initPage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        setCurrentUser(session.user);

        // Get organization
        const { data: memberships } = await supabase
          .from('memberships')
          .select('organization_id, role')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .limit(1);

        if (!memberships?.[0]) {
          router.push('/dashboard');
          return;
        }

        const orgId = memberships[0].organization_id;
        const userRole = memberships[0].role;

        const { data: orgs } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();

        setOrg(orgs);

        // Fetch members with profile info
        const { data: memberData } = await supabase
          .from('memberships')
          .select(`
            id,
            user_id,
            role,
            status,
            profiles:user_id(full_name, email)
          `)
          .eq('organization_id', orgId);

        if (memberData) {
          const formatted = memberData.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            role: m.role,
            status: m.status,
            email: m.profiles?.email,
            full_name: m.profiles?.full_name,
          }));
          setMembers(formatted);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;

    try {
      const { error } = await supabase.from('invitations').insert({
        organization_id: org.id,
        email: inviteForm.email,
        role: inviteForm.role,
        invited_by: currentUser?.id,
      });

      if (error) throw error;

      alert('Invitation sent to ' + inviteForm.email);
      setInviteForm({ email: '', role: 'recruiter' });
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;

    try {
      await supabase
        .from('memberships')
        .update({ status: 'suspended' })
        .eq('id', memberId);

      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await supabase
        .from('memberships')
        .update({ role: newRole })
        .eq('id', memberId);

      setMembers(members.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update role');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!org) return <div className="p-8">Organization not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600">Manage your team and permissions</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Invite Member
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {members.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">No team members yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Email</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Role</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{member.full_name || 'Unnamed'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>
                            {role.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Invite Team Member</h2>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="member@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
