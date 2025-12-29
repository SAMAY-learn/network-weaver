import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PageRank-style algorithm for threat scoring
function calculatePageRank(
  nodes: Map<string, { type: string; connections: string[] }>,
  iterations: number = 20,
  dampingFactor: number = 0.85
): Map<string, number> {
  const n = nodes.size;
  if (n === 0) return new Map();

  // Initialize scores
  const scores = new Map<string, number>();
  const nodeIds = Array.from(nodes.keys());
  
  nodeIds.forEach(id => scores.set(id, 1 / n));

  // Iterate PageRank
  for (let i = 0; i < iterations; i++) {
    const newScores = new Map<string, number>();
    
    nodeIds.forEach(id => {
      let sum = 0;
      
      // Sum contributions from incoming links
      nodeIds.forEach(otherId => {
        const otherNode = nodes.get(otherId);
        if (otherNode && otherNode.connections.includes(id)) {
          const outDegree = otherNode.connections.length;
          if (outDegree > 0) {
            sum += (scores.get(otherId) || 0) / outDegree;
          }
        }
      });
      
      // Apply damping factor
      newScores.set(id, (1 - dampingFactor) / n + dampingFactor * sum);
    });
    
    // Update scores
    newScores.forEach((score, id) => scores.set(id, score));
  }

  return scores;
}

// Calculate threat level based on multiple factors
function calculateThreatLevel(
  pageRankScore: number,
  connectionCount: number,
  fraudAmount: number,
  hasHighThreatConnections: boolean
): { score: number; level: 'high' | 'medium' | 'low' } {
  // Normalize PageRank (0-40 points)
  const prScore = Math.min(pageRankScore * 4000, 40);
  
  // Connection score (0-25 points)
  const connScore = Math.min(connectionCount * 2, 25);
  
  // Fraud amount score (0-25 points)
  const fraudScore = Math.min(Math.log10(fraudAmount + 1) * 5, 25);
  
  // High threat connection bonus (0-10 points)
  const threatBonus = hasHighThreatConnections ? 10 : 0;
  
  const totalScore = Math.round(prScore + connScore + fraudScore + threatBonus);
  const clampedScore = Math.min(Math.max(totalScore, 0), 100);
  
  let level: 'high' | 'medium' | 'low';
  if (clampedScore >= 70) {
    level = 'high';
  } else if (clampedScore >= 40) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return { score: clampedScore, level };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting threat score calculation...");

    // Fetch all suspects
    const { data: suspects, error: suspectsError } = await supabase
      .from("suspects")
      .select("*");

    if (suspectsError) throw suspectsError;
    
    if (!suspects || suspects.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No suspects to process",
        updated: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${suspects.length} suspects...`);

    // Fetch network edges
    const { data: edges, error: edgesError } = await supabase
      .from("network_edges")
      .select("*");

    if (edgesError) throw edgesError;

    // Build graph for PageRank
    const graph = new Map<string, { type: string; connections: string[] }>();
    
    // Add suspects to graph
    suspects.forEach(s => {
      graph.set(s.id, { type: 'suspect', connections: [] });
    });

    // Add edges
    edges?.forEach(edge => {
      if (edge.source_type === 'suspect' && graph.has(edge.source_id)) {
        graph.get(edge.source_id)!.connections.push(edge.target_id);
      }
      if (edge.target_type === 'suspect' && graph.has(edge.target_id)) {
        graph.get(edge.target_id)!.connections.push(edge.source_id);
      }
    });

    // Calculate PageRank scores
    const pageRankScores = calculatePageRank(graph);
    console.log("PageRank calculation complete");

    // Get connection counts for each suspect
    const connectionCounts = new Map<string, number>();
    suspects.forEach(s => {
      const node = graph.get(s.id);
      connectionCounts.set(s.id, node?.connections.length || 0);
    });

    // Update threat scores for all suspects
    const updates: Array<{ id: string; threat_score: number; threat_level: string }> = [];
    
    for (const suspect of suspects) {
      const prScore = pageRankScores.get(suspect.id) || 0;
      const connCount = connectionCounts.get(suspect.id) || 0;
      const fraudAmount = suspect.fraud_amount || 0;
      
      // Check if connected to high-threat entities
      const node = graph.get(suspect.id);
      let hasHighThreat = false;
      if (node) {
        for (const connId of node.connections) {
          const connSuspect = suspects.find(s => s.id === connId);
          if (connSuspect && connSuspect.threat_level === 'high') {
            hasHighThreat = true;
            break;
          }
        }
      }
      
      const { score, level } = calculateThreatLevel(prScore, connCount, fraudAmount, hasHighThreat);
      
      updates.push({
        id: suspect.id,
        threat_score: score,
        threat_level: level,
      });
    }

    // Batch update suspects
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("suspects")
        .update({ 
          threat_score: update.threat_score, 
          threat_level: update.threat_level 
        })
        .eq("id", update.id);
      
      if (updateError) {
        console.error(`Failed to update suspect ${update.id}:`, updateError);
      }
    }

    console.log(`Updated threat scores for ${updates.length} suspects`);

    // Get top kingpins
    const topKingpins = updates
      .sort((a, b) => b.threat_score - a.threat_score)
      .slice(0, 5)
      .map(k => {
        const suspect = suspects.find(s => s.id === k.id);
        return {
          id: k.id,
          name: suspect?.name,
          alias: suspect?.alias,
          threat_score: k.threat_score,
          threat_level: k.threat_level,
        };
      });

    return new Response(JSON.stringify({ 
      success: true, 
      updated: updates.length,
      topKingpins,
      message: `Recalculated threat scores for ${updates.length} suspects`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in calculate-threat-scores:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
