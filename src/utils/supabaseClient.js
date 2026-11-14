import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://efsybrwzawtmoyyudnhh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_LoUk8daFTcWPeiASEU_aWw_rNNWiFxP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log EVA Mission dispatch into cloud database
export async function logEVAMission(missionRecord) {
  try {
    const { data, error } = await supabase
      .from('eva_mission_logs')
      .insert([
        {
          astronaut_name: missionRecord.astronautName || 'Shaswat Sinha',
          hub_location: 'Surat, India',
          team_name: 'Singular Anomaly',
          route_type: missionRecord.routeType,
          safety_score: missionRecord.safetyScore,
          distance_km: missionRecord.distanceKm,
          max_slope_deg: missionRecord.maxSlopeDeg,
          oxygen_expended_pct: missionRecord.oxygenExpendedPct,
          target_site: missionRecord.targetSite,
          created_at: new Date().toISOString()
        }
      ]);
    if (error) {
      console.warn("Supabase log notice (table may need schema creation, falling back to local sync):", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase network sync notice:", err);
    return false;
  }
}
