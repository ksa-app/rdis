import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cached, invalidateCandidate } from '@/lib/cache';
import { CacheKey, TTL } from '@/lib/redis';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── GET /api/candidates ──────────────────────────────────────────────────
// Query params: org_id, page, limit, search, country, agent
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId   = searchParams.get('org_id') ?? '';
  const page    = Number(searchParams.get('page') ?? 1);
  const limit   = Number(searchParams.get('limit') ?? 50);
  const search  = searchParams.get('search') ?? '';
  const country = searchParams.get('country') ?? '';
  const agent   = searchParams.get('agent') ?? '';

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 });
  }

  const filterKey = `${search}|${country}|${agent}`;
  const cacheKey  = CacheKey.candidates(orgId, page, filterKey);

  const data = await cached(cacheKey, TTL.MEDIUM, async () => {
    const supabase = getSupabase();
    const from = (page - 1) * limit;

    let query = supabase
      .from('candidates')
      .select(`
        id, sl, name, passport_no, received_date,
        country, scan_copy, is_deleted, created_at,
        agents:agent(id, full_name, "CODE")
      `, { count: 'exact' })
      .eq('is_deleted', false)
      .order('sl', { ascending: false })
      .range(from, from + limit - 1);

    if (search)  query = query.or(`name.ilike.%${search}%,passport_no.ilike.%${search}%`);
    if (country) query = query.eq('country', country);
    if (agent)   query = query.eq('agent', agent);

    const { data, count, error } = await query;
    if (error) throw error;
    return { rows: data, total: count, page, limit };
  });

  return NextResponse.json(data);
}

// ─── POST /api/candidates ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { org_id, ...payload } = body;

  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('candidates')
    .insert({ ...payload, organization_id: org_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await invalidateCandidate(org_id);
  return NextResponse.json(data, { status: 201 });
}

// ─── PATCH /api/candidates ────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, org_id, ...updates } = body;

  if (!id || !org_id) return NextResponse.json({ error: 'id and org_id required' }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('candidates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await invalidateCandidate(org_id, id);
  return NextResponse.json(data);
}

// ─── DELETE /api/candidates ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id     = searchParams.get('id') ?? '';
  const org_id = searchParams.get('org_id') ?? '';

  if (!id || !org_id) return NextResponse.json({ error: 'id and org_id required' }, { status: 400 });

  const supabase = getSupabase();
  // Soft delete
  const { error } = await supabase
    .from('candidates')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await invalidateCandidate(org_id, id);
  return NextResponse.json({ success: true });
}
