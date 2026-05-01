import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env.local.");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

export type Client = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  investment_amount: number;
  risk_profile: "conservative" | "moderate" | "aggressive";
  returns_percent: number;
  website_status: "none" | "building" | "live";
  created_at: string;
};

export type Stock = {
  id: string;
  user_id: string;
  client_id: string | null;
  symbol: string;
  company_name: string;
  buy_price: number;
  current_price: number;
  quantity: number;
  created_at: string;
};

export type Website = {
  id: string;
  user_id: string;
  client_id: string | null;
  template_type: "portfolio" | "business" | "landing" | "blog";
  prompt_used: string | null;
  generated_html: string | null;
  status: "draft" | "published";
  url_slug: string | null;
  created_at: string;
};
