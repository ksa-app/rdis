'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CreditCard, Download } from 'lucide-react';

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function BillingPage() {
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initPage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

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

        // Fetch invoices
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        setInvoices(invoiceData || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  const handleUpgrade = () => {
    alert('Stripe integration coming soon! Contact support for enterprise plans.');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!org) return <div className="p-8">Organization not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and payments</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current Plan */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Current Plan</h2>
              <CreditCard className="text-blue-600" size={24} />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Plan Type</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{org.plan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  org.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {org.subscription_status}
                </span>
              </div>
              {org.plan === 'trial' && org.trial_ends_at && (
                <div>
                  <p className="text-sm text-gray-600">Trial Ends</p>
                  <p className="text-gray-900">
                    {new Date(org.trial_ends_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {org.plan === 'trial' && (
                <button
                  onClick={handleUpgrade}
                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>

          {/* Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Usage</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-600">Storage Used</p>
                  <p className="text-sm font-medium text-gray-900">{org.storage_used} MB</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((org.storage_used / 10240) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">Plan includes 10 GB storage</p>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Billing History</h2>
          </div>

          {invoices.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-900">Invoice #</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-900">Amount</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-900">Date</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{invoice.invoice_number}</td>
                      <td className="px-6 py-4">${invoice.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">💳 Payment Methods</h3>
          <p className="text-sm text-blue-800 mb-4">
            Stripe integration coming soon. Currently, we support manual payment processing.
          </p>
          <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Contact Sales
          </button>
        </div>
      </main>
    </div>
  );
}
