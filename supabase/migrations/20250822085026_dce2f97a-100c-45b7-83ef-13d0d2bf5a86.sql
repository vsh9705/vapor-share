-- Create files table to store file metadata and access codes
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  is_accessed BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accessed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own files" 
ON public.files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own files" 
ON public.files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" 
ON public.files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" 
ON public.files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy for file access by code (public access)
CREATE POLICY "Anyone can access files by valid code" 
ON public.files 
FOR SELECT 
USING (
  access_code IS NOT NULL 
  AND is_accessed = FALSE 
  AND expires_at > now()
);

-- Create index for fast access code lookups
CREATE INDEX idx_files_access_code ON public.files(access_code) WHERE is_accessed = FALSE;

-- Create index for cleanup of expired files
CREATE INDEX idx_files_expires_at ON public.files(expires_at) WHERE is_accessed = FALSE;

-- Function to generate secure access codes
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to clean up expired files
CREATE OR REPLACE FUNCTION public.cleanup_expired_files()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Count expired files
  SELECT count(*) INTO cleanup_count
  FROM public.files
  WHERE expires_at < now() OR is_accessed = TRUE;
  
  -- Delete expired files
  DELETE FROM public.files
  WHERE expires_at < now() OR is_accessed = TRUE;
  
  RETURN cleanup_count;
END;
$$;