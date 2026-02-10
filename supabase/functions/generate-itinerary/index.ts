import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

type AiAnswers = {
  destination: string;
  startDate: string;
  days: number;
  travelers: {
    count: number;
    groupType: string;
  };
  budget: string;
  pace: string;
  interests: string[];
  mustDo?: string;
  constraints?: string;
  language?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

const siteUrl = Deno.env.get("SITE_URL") ?? "https://routeit.vercel.app";
const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ?? `${siteUrl},http://localhost:5173`)
    .split(",")
    .map(value => value.trim())
    .filter(Boolean),
);

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin ?? siteUrl,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  return allowedOrigins.has(origin);
};

const parseJsonOutput = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '');
  try {
    return JSON.parse(withoutFence);
  } catch {
    const match = withoutFence.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const buildPrompt = (answers: AiAnswers) => {
  const language = answers.language?.trim() || "es";
  return [
    "Eres un planificador de viajes. Genera SOLO JSON valido con el siguiente esquema.",
    "No incluyas texto extra, markdown ni bloques de codigo.",
    "",
    "Esquema:",
    "{",
    "  \"trip\": {",
    "    \"title\": string,",
    "    \"dateRange\": string,",
    "    \"intro\": string,",
    "    \"startDate\": \"YYYY-MM-DD\",",
    "    \"days\": number,",
    "    \"budgetLevel\": \"economy|mid|premium\",",
    "    \"pace\": \"relaxed|balanced|intense\",",
    "    \"travelers\": { \"count\": number, \"groupType\": string },",
    "    \"interests\": string[]",
    "  },",
    "  \"cities\": [",
    "    { \"city\": string, \"days\": number, \"region\": string, \"notes\": string[], \"highlights\": string[] }",
    "  ],",
    "  \"days\": [],",
    "  \"tagsCatalog\": [",
    "    { \"name\": string, \"slug\": string, \"color\": string }",
    "  ],",
    "  \"phrases\": [",
    "    { \"spanish\": string, \"pinyin\": string, \"chinese\": string }",
    "  ],",
    "  \"extras\": {",
    "    \"foods\": string[],",
    "    \"tips\": string[],",
    "    \"avoid\": string[],",
    "    \"packing\": string[],",
    "    \"transport\": string[],",
    "    \"safety\": string[],",
    "    \"utilities\": string[],",
    "    \"money\": string[],",
    "    \"connectivity\": string[],",
    "    \"etiquette\": string[],",
    "    \"weather\": string[],",
    "    \"scams\": string[],",
    "    \"budgetTips\": string[],",
    "    \"emergency\": string[]",
    "  }",
    "}",
    "",
    "Requisitos:",
    "- El JSON debe estar completo y sin truncar.",
    "- Incluye 10-12 frases utiles. Si el destino no es China, usa \"pinyin\" como pronunciacion y \"chinese\" como texto local.",
    "- Crea 12-16 etiquetas en tagsCatalog con slug en kebab-case y colores hex (#RRGGBB).",
    "- Cada nota debe ser corta (1 linea).",
    "- Completa todas las listas de extras con 6-8 items cada una.",
    "- Si el contenido es demasiado largo, reduce listas y notas antes de cortar JSON.",
    "- Por ahora, devuelve days como un array vacio.",
    "",
    `Idioma de salida: ${language}.`,
    "",
    "Datos del usuario:",
    JSON.stringify(answers),
  ].join("\n");
};

const requestGemini = async (prompt: string, modelPath: string, apiKey: string, maxTokens: number) => {
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: maxTokens,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gemini error");
  }

  const data = (await response.json()) as GeminiResponse;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
    const rawModel = Deno.env.get("GEMINI_MODEL") ?? "models/gemini-1.5-flash";
    const modelPath = rawModel.startsWith("models/") ? rawModel : `models/${rawModel}`;
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

      if (!geminiKey || !supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Missing server configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

      const authHeader = req.headers.get("Authorization") ?? "";
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...headers },
        });
      }

    const body = await req.json();
    const answers = body?.answers as AiAnswers | undefined;
    if (!answers || typeof answers.destination !== "string") {
      return new Response(JSON.stringify({ error: "Missing answers" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    const text = await requestGemini(buildPrompt(answers), modelPath, geminiKey, 6144);
    const parsed = parseJsonOutput(text);

    if (!parsed) {
      console.error('Invalid AI response:', text.slice(0, 4000));
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { "Content-Type": "application/json", ...headers },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...headers } },
    );
  }
});
