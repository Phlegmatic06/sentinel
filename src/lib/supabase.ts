import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function logSentinelViolation(type: string, imageBlob: Blob | null) {
  let imageUrl: string | null = null;
  
  if (imageBlob && supabaseUrl !== "https://placeholder-url.supabase.co") {
    const fileName = `${Date.now()}-${type.replace(/\\s+/g, '-')}.jpg`;
    
    // Upload to bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sentinel-evidence')
      .upload(fileName, imageBlob, {
        contentType: 'image/jpeg'
      });
      
    if (!uploadError && uploadData) {
      const { data: publicUrlData } = supabase.storage
        .from('sentinel-evidence')
        .getPublicUrl(uploadData.path);
        
      imageUrl = publicUrlData.publicUrl;
    } else {
      console.error("Supabase upload error:", uploadError);
    }
  }

  // Insert to sentinel_logs (only if configured)
  if (supabaseUrl !== "https://placeholder-url.supabase.co") {
    const { error: dbError } = await supabase
      .from('sentinel_logs')
      .insert({
        violation_type: type,
        image_url: imageUrl
      });
      
    if (dbError) {
      console.error("Supabase DB error:", dbError);
    }
  } else {
    // Development fallback mock
    console.log("[MOCK DB INSERT] Sentinel Log:", {
      violation_type: type,
      image_url: imageUrl || 'mock-image-url.jpg',
      created_at: new Date().toISOString()
    });
  }
}
