'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LogOut, Users, FileText, Briefcase, DollarSign, Settings } from 'lucide-react';

type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getOrgAndUser = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        setUser(session.user);

        // Get user's organization
        const { data: memberships } = await supabase
          .from('memberships')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .limit(1);

        if (memberships && memberships.length > 0) {
          const { data: organizations } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', memberships[0].organization_id)
            .single();

          setOrg(organizations);
        }
      } catch (error) {
        console.error('Error fetching org:', error);
      } finally {
        setLoading(false);
      }
    };

    getOrgAndUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-center">
          <p className="mb-4">No organization found. Please contact support.</p>
          <button onClick={handleLogout} className="text-blue-600 hover:underline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
            <p className="text-sm text-gray-600">Plan: {org.plan}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Candidates */}
          <Link href="/candidates">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Candidates</h2>
                <Briefcase className="text-blue-600" size={24} />
              </div>
              <p className="text-gray-600 text-sm">Manage candidate database and pipeline</p>
            </div>
          </Link>

          {/* Team */}
          <Link href="/team">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Team</h2>
                <Users className="text-green-600" size={24} />
              </div>
              <p className="text-gray-600 text-sm">Manage team members and roles</p>
            </div>
          </Link>

          {/* Billing */}
          <Link href="/billing">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
                <DollarSign className="text-purple-600" size={24} />
              </div>
              <p className="text-gray-600 text-sm">View subscription and payments</p>
            </div>
          </Link>

          {/* Reports */}
          <Link href="/reports">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
                <FileText className="text-orange-600" size={24} />
              </div>
              <p className="text-gray-600 text-sm">View analytics and reports</p>
            </div>
          </Link>

          {/* Settings */}
          <Link href="/settings">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                <Settings className="text-gray-600" size={24} />
              </div>
              <p className="text-gray-600 text-sm">Organization settings and preferences</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
