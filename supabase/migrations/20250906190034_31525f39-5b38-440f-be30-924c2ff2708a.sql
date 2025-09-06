-- Fix security issues: Update functions to set search_path parameter

-- Update generate_access_code function with search_path
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update cleanup_expired_files function with search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_files()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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