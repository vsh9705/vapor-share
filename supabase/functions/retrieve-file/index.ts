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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    )

    if (req.method === 'POST') {
      // Get file info by access code
      const { accessCode } = await req.json();

      if (!accessCode) {
        return new Response(
          JSON.stringify({ error: 'Access code is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if file exists and is valid
      const { data: fileData, error: fileError } = await supabaseClient
        .from('files')
        .select('*')
        .eq('access_code', accessCode.toUpperCase())
        .eq('is_accessed', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fileError || !fileData) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid or expired access code. The file may have already been downloaded or expired.' 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          file: {
            id: fileData.id,
            filename: fileData.original_filename,
            size: fileData.file_size,
            mimeType: fileData.mime_type,
            expiresAt: fileData.expires_at,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Download file
      const url = new URL(req.url);
      const accessCode = url.searchParams.get('code');

      if (!accessCode) {
        return new Response(
          JSON.stringify({ error: 'Access code is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get file data and mark as accessed in a transaction
      const { data: fileData, error: fileError } = await supabaseClient
        .from('files')
        .select('*')
        .eq('access_code', accessCode.toUpperCase())
        .eq('is_accessed', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fileError || !fileData) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid or expired access code. The file may have already been downloaded or expired.' 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark file as accessed
      const { error: updateError } = await supabaseClient
        .from('files')
        .update({ 
          is_accessed: true, 
          accessed_at: new Date().toISOString() 
        })
        .eq('id', fileData.id);

      if (updateError) {
        console.error('Error marking file as accessed:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to process file access' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('File marked as accessed:', fileData.id);

      // Start background task to delete from Cloudinary
      const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
      const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
      const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

      if (cloudName && apiKey && apiSecret) {
        EdgeRuntime.waitUntil(
          (async () => {
            try {
              const timestamp = Math.round(Date.now() / 1000);
              const paramsToSign = `public_id=${fileData.cloudinary_public_id}&timestamp=${timestamp}`;
              
              const signature = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(apiSecret),
                { name: 'HMAC', hash: 'SHA-1' },
                false,
                ['sign']
              ).then(key =>
                crypto.subtle.sign('HMAC', key, new TextEncoder().encode(paramsToSign))
              ).then(signature =>
                Array.from(new Uint8Array(signature))
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join('')
              );

              const deleteResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                    public_id: fileData.cloudinary_public_id,
                    api_key: apiKey,
                    timestamp: timestamp.toString(),
                    signature: signature,
                  }),
                }
              );

              if (deleteResponse.ok) {
                console.log('File deleted from Cloudinary:', fileData.cloudinary_public_id);
              } else {
                console.error('Failed to delete from Cloudinary:', await deleteResponse.text());
              }
            } catch (error) {
              console.error('Background deletion error:', error);
            }
          })()
        );
      }

      // Redirect to Cloudinary URL for download
      return Response.redirect(fileData.cloudinary_url, 302);
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Retrieve error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});