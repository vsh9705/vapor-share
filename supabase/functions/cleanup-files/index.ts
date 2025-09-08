import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting cleanup of deleted files...');

    // Get Cloudinary credentials
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get files that are marked as deleted but still have Cloudinary references
    const { data: filesToCleanup, error: fetchError } = await supabaseClient
      .from('files')
      .select('*')
      .eq('deleted', true)
      .not('cloudinary_public_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching files to cleanup:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch files for cleanup' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!filesToCleanup || filesToCleanup.length === 0) {
      console.log('No files to cleanup');
      return new Response(
        JSON.stringify({ success: true, cleaned: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filesToCleanup.length} files to cleanup`);

    // Delete files from Cloudinary
    let deletedFromCloudinary = 0;
    for (const file of filesToCleanup) {
      try {
        const timestamp = Math.round(Date.now() / 1000);
        const paramsToSign = `public_id=${file.cloudinary_public_id}&timestamp=${timestamp}${apiSecret}`;
        const msgUint8 = new TextEncoder().encode(paramsToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
        const signature = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        const deleteResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              public_id: file.cloudinary_public_id,
              api_key: apiKey,
              timestamp: timestamp.toString(),
              signature: signature,
            }),
          }
        );

        if (deleteResponse.ok) {
          console.log(`Deleted from Cloudinary: ${file.cloudinary_public_id}`);
          deletedFromCloudinary++;
          
          // Clear cloudinary references from database after successful deletion
          await supabaseClient
            .from('files')
            .update({ 
              cloudinary_public_id: null, 
              cloudinary_url: null 
            })
            .eq('id', file.id);
        } else {
          console.error(`Failed to delete from Cloudinary: ${file.cloudinary_public_id}`, await deleteResponse.text());
        }
      } catch (error) {
        console.error(`Error deleting ${file.cloudinary_public_id} from Cloudinary:`, error);
      }
    }

    // The database cleanup is now handled by marking files as deleted during retrieval
    // No need to call cleanup_expired_files RPC since we're not physically deleting records

    console.log(`Cleanup completed. Deleted ${deletedFromCloudinary} files from Cloudinary.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleaned: filesToCleanup.length,
        deletedFromCloudinary 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});