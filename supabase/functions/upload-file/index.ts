import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
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

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const recipientEmail = formData.get('recipientEmail') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Generate unique filename
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `vapor-share/${user.id}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Create signature for Cloudinary upload (parameters must be sorted alphabetically)
    // According to Cloudinary docs: append API secret to params string, then SHA-1 hash
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const msgUint8 = new TextEncoder().encode(paramsToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Upload to Cloudinary
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('timestamp', timestamp.toString());
    uploadFormData.append('signature', signature);
    uploadFormData.append('public_id', publicId);

    console.log('Uploading to Cloudinary...');
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary upload failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'File upload failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cloudinaryResult: CloudinaryResponse = await cloudinaryResponse.json();
    console.log('Cloudinary upload successful:', cloudinaryResult.public_id);

    // Generate access code
    const { data: codeData, error: codeError } = await supabaseClient
      .rpc('generate_access_code');

    if (codeError) {
      console.error('Error generating access code:', codeError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate access code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store file metadata in database
    const { data: fileData, error: dbError } = await supabaseClient
      .from('files')
      .insert({
        user_id: user.id,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        cloudinary_public_id: cloudinaryResult.public_id,
        cloudinary_url: cloudinaryResult.secure_url,
        access_code: codeData,
        sender_email: user.email,
        recipient_email: recipientEmail,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      
      // Clean up Cloudinary file if database insert failed
      try {
        const deleteParams = `public_id=${cloudinaryResult.public_id}&timestamp=${timestamp}${apiSecret}`;
        const deleteMsgUint8 = new TextEncoder().encode(deleteParams);
        const deleteHashBuffer = await crypto.subtle.digest('SHA-1', deleteMsgUint8);
        const deleteSignature = Array.from(new Uint8Array(deleteHashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            public_id: cloudinaryResult.public_id,
            api_key: apiKey,
            timestamp: timestamp.toString(),
            signature: deleteSignature,
          }),
        });
      } catch (cleanupError) {
        console.error('Failed to cleanup Cloudinary file:', cleanupError);
      }

      return new Response(
        JSON.stringify({ error: 'Failed to save file metadata' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If recipient email is provided, check if user exists and create notification
    if (recipientEmail) {
      const { data: recipientUsers } = await supabaseClient.auth.admin.listUsers();
      const recipientUser = recipientUsers?.users?.find(u => u.email === recipientEmail);
      
      if (recipientUser) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: recipientUser.id,
            sender_email: user.email || 'Unknown',
            file_code: codeData,
            file_name: file.name,
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        accessCode: codeData,
        filename: file.name,
        size: file.size,
        fileId: fileData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});