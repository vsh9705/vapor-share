-- Update cleanup function to work with deleted field
CREATE OR REPLACE FUNCTION public.cleanup_expired_files()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Count files that need cleanup but aren't already marked as deleted
  SELECT count(*) INTO cleanup_count
  FROM public.files
  WHERE (expires_at < now() OR is_accessed = TRUE) AND deleted = FALSE;
  
  -- Mark expired/accessed files as deleted instead of physically deleting them
  UPDATE public.files
  SET deleted = TRUE
  WHERE (expires_at < now() OR is_accessed = TRUE) AND deleted = FALSE;
  
  RETURN cleanup_count;
END;
$function$