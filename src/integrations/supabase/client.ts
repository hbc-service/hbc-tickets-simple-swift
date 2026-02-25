import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yypudjdmbmhbcooxnevd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__T0MNVLfj5q50z7j9Q0V_g_OGq9QLEJ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
