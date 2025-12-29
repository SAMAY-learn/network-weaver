import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedEntities {
  suspects: Array<{
    name: string;
    alias?: string;
    phone_numbers?: string[];
    location?: string;
  }>;
  sim_cards: Array<{
    phone_number: string;
    imsi?: string;
    location?: string;
  }>;
  devices: Array<{
    imei: string;
    device_model?: string;
    location?: string;
  }>;
  mule_accounts: Array<{
    account_number: string;
    bank_name?: string;
    ifsc_code?: string;
    account_holder?: string;
  }>;
  ip_addresses: Array<{
    ip_address: string;
    location?: string;
    is_vpn?: boolean;
  }>;
  relationships: Array<{
    source_type: string;
    source_id: string;
    target_type: string;
    target_id: string;
    relationship_type: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, fileType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${fileType} content, length: ${content?.length || 0} characters`);

    const systemPrompt = `You are an expert fraud investigation analyst. Your task is to extract structured entities from CDR (Call Detail Records), FIR (First Information Reports), and transaction data.

Extract ALL entities found in the data and output ONLY valid JSON with this exact structure:
{
  "suspects": [{"name": "string", "alias": "string (optional)", "phone_numbers": ["string"], "location": "string"}],
  "sim_cards": [{"phone_number": "string", "imsi": "string (optional)", "location": "string"}],
  "devices": [{"imei": "string", "device_model": "string (optional)", "location": "string"}],
  "mule_accounts": [{"account_number": "string", "bank_name": "string", "ifsc_code": "string", "account_holder": "string"}],
  "ip_addresses": [{"ip_address": "string", "location": "string", "is_vpn": false}],
  "relationships": [{"source_type": "suspect|sim|device|account|ip", "source_id": "identifier", "target_type": "suspect|sim|device|account|ip", "target_id": "identifier", "relationship_type": "call|transaction|shared_device|shared_ip"}]
}

Rules:
1. Extract phone numbers in format: +91-XXXXXXXXXX or as found
2. Extract IMEI numbers (15 digits)
3. Extract bank account numbers and IFSC codes
4. Extract IP addresses
5. Identify relationships between entities (calls, transactions, shared devices/IPs)
6. Infer suspect names from account holders or context
7. Mark locations when found
8. Return ONLY the JSON object, no explanations`;

    const userPrompt = `Extract all entities from this ${fileType} data:\n\n${content.substring(0, 15000)}`;

    console.log("Calling Lovable AI Gateway for entity extraction...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    console.log("AI Response received, parsing entities...");

    // Parse the JSON from the response
    let entities: ExtractedEntities;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        entities = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", aiResponse.substring(0, 500));
      entities = {
        suspects: [],
        sim_cards: [],
        devices: [],
        mule_accounts: [],
        ip_addresses: [],
        relationships: [],
      };
    }

    console.log(`Extracted: ${entities.suspects?.length || 0} suspects, ${entities.sim_cards?.length || 0} SIMs, ${entities.devices?.length || 0} devices, ${entities.mule_accounts?.length || 0} accounts, ${entities.ip_addresses?.length || 0} IPs`);

    return new Response(JSON.stringify({ 
      success: true, 
      entities,
      summary: {
        suspects: entities.suspects?.length || 0,
        sim_cards: entities.sim_cards?.length || 0,
        devices: entities.devices?.length || 0,
        mule_accounts: entities.mule_accounts?.length || 0,
        ip_addresses: entities.ip_addresses?.length || 0,
        relationships: entities.relationships?.length || 0,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-entities:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
