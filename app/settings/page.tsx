'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    company_address: '',
    phone: '',
    email: '',
    website: '',
    tax_id: '',
  });

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

        // Get settings
        const { data: settingsData } = await supabase
          .from('settings')
          .select('*')
          .eq('organization_id', orgId)
          .single();

        if (settingsData) {
          setSettings(settingsData);
          setForm({
            company_name: settingsData.company_name || '',
            company_address: settingsData.company_address || '',
            phone: settingsData.phone || '',
            email: settingsData.email || '',
            website: settingsData.website || '',
            tax_id: settingsData.tax_id || '',
          });
        } else {
          // Create default settings
          const { data: newSettings } = await supabase
            .from('settings')
            .insert({ organization_id: orgId })
            .select()
            .single();
          setSettings(newSettings);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await supabase
        .from('settings')
        .update(form)
        .eq('id', settings.id);

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!org) return <div className="p-8">Organization not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage organization settings</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Organization Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={org.name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={org.slug}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan
                  </label>
                  <input
                    type="text"
                    value={org.plan}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <input
                    type="text"
                    value={org.subscription_status}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="my-8" />

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Company Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={form.company_address}
                  onChange={(e) => setForm({ ...form, company_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={form.tax_id}
                    onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-8 pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
