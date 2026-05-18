import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mclasiklsxhmptgaznqn.supabase.co";
const supabaseKey = "sb_publishable_jqozIshXDwFWH_kCpnitjw_UJuDM14L";

export const supabase =
  createClient(
    supabaseUrl,
    supabaseKey
  );