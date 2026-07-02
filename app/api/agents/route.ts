import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cached, invalidate } from '@/lib/cache';
import { CacheKey, TTL } from '@/lib/redis';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Agents & Agencies cached LONG (rarely change)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('org_id') ?? '';
  const type  = searchParams.get('type') ?? 'agents'; // 'agents' or 'agencies'

  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 });

  const cacheKey = type === 'agencies' ? CacheKey.agencies(orgId) : CacheKey.agents(orgId);

  const data = await cached(cacheKey, TTL.LONG, async () => {
    const supabase = getSupabase();
    if (type === 'agencies') {
      const { data, error } = await supabase
        .from('agency')
        .select('uuid, name, rl')
        .order('name');
      if (error) throw error;
      return data;
    } else {
      // NOTE: agents."CODE" needs double-quotes in Supabase JS
      const { data, error } = await supabase
        .from('agents')
        .select('id, full_name, "CODE"')
        .order('full_name');
      if (error) throw error;
      return data;
    }
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { org_id, type, ...payload } = body;
  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 });

  const supabase = getSupabase();
  const table = type === 'agencies' ? 'agency' : 'agents';
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Bust the relevant cache
  const cacheKey = type === 'agencies' ? CacheKey.agencies(org_id) : CacheKey.agents(org_id);
  await invalidate(cacheKey);

  return NextResponse.json(data, { status: 201 });
}
