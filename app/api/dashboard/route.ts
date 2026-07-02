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

  const data = await cached(CacheKey.dashboard(orgId), TTL.SHORT, async () => {
    const supabase = getSupabase();

    // Run all queries in parallel
    const [
      candidatesRes,
      medicalsRes,
      mofasRes,
      visasRes,
      fitMedicalsRes,
      pendingVisasRes,
      approvedVisasRes,
      expiringVisasRes,
    ] = await Promise.all([
      supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('medicals').select('id', { count: 'exact', head: true }),
      supabase.from('mofas').select('id', { count: 'exact', head: true }),
      supabase.from('visas').select('id', { count: 'exact', head: true }),

      // FIT medicals not yet used
      supabase.from('medicals').select('id', { count: 'exact', head: true })
        .eq('status', 'FIT').eq('mofa_update', false),

      // Pending visas
      supabase.from('visas').select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING'),

      // Approved visas
      supabase.from('visas').select('id', { count: 'exact', head: true })
        .eq('status', 'APPROVED'),

      // Visas expiring within 30 days
      supabase.from('visas')
        .select('id, candidate_id, expiry_date, visa_type, candidates:candidate_id(name, passport_no)')
        .eq('status', 'APPROVED')
        .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('expiry_date')
        .limit(10),
    ]);

    return {
      kpis: {
        totalCandidates: candidatesRes.count ?? 0,
        totalMedicals:   medicalsRes.count   ?? 0,
        totalMofas:      mofasRes.count      ?? 0,
        totalVisas:      visasRes.count      ?? 0,
        fitMedicals:     fitMedicalsRes.count ?? 0,
        pendingVisas:    pendingVisasRes.count ?? 0,
        approvedVisas:   approvedVisasRes.count ?? 0,
      },
      alerts: {
        expiringVisas: expiringVisasRes.data ?? [],
      },
      cachedAt: new Date().toISOString(),
    };
  });

  return NextResponse.json(data);
}
