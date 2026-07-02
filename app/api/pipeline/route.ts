import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { CacheKey, TTL } from '@/lib/redis';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('org_id') ?? '';
  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 });

  const data = await cached(CacheKey.pipeline(orgId), TTL.MEDIUM, async () => {
    const supabase = getSupabase();

    // Reads the candidate_pipeline VIEW (created by pipeline_setup.sql)
    const { data, error } = await supabase
      .from('candidate_pipeline')
      .select('*')
      .order('sl', { ascending: false });

    if (error) throw error;
    return data;
  });

  return NextResponse.json(data);
}
