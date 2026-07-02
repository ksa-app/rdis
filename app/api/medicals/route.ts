import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cached, invalidate, invalidatePattern } from '@/lib/cache';
import { CacheKey, TTL } from '@/lib/redis';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId       = searchParams.get('org_id') ?? '';
  const candidateId = searchParams.get('candidate_id') ?? undefined;

  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 });

  const cacheKey = CacheKey.medicals(orgId, candidateId);

  const data = await cached(cacheKey, TTL.MEDIUM, async () => {
    const supabase = getSupabase();
    let query = supabase
      .from('medicals')
      .select(`
        id, sl, medical_date, fit_date, status, mofa_update, created_at, updated_at,
        candidates:candidate_id(id, name, passport_no, sl)
      `)
      .order('sl', { ascending: false });

    if (candidateId) query = query.eq('candidate_id', candidateId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { org_id, ...payload } = body;
  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('medicals')
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Bust all medical caches for this org
  await invalidatePattern(`org:${org_id}:medicals:*`);
  await invalidate(CacheKey.dashboard(org_id));

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, org_id, ...updates } = body;
  if (!id || !org_id) return NextResponse.json({ error: 'id and org_id required' }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('medicals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await invalidatePattern(`org:${org_id}:medicals:*`);
  await invalidate(CacheKey.dashboard(org_id));

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id     = searchParams.get('id') ?? '';
  const org_id = searchParams.get('org_id') ?? '';
  if (!id || !org_id) return NextResponse.json({ error: 'id and org_id required' }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase.from('medicals').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await invalidatePattern(`org:${org_id}:medicals:*`);
  return NextResponse.json({ success: true });
}
