-- Add deleted field to files table
ALTER TABLE public.files 
ADD COLUMN deleted boolean NOT NULL DEFAULT false;

-- Update RLS policy to exclude deleted files from public access
DROP POLICY IF EXISTS "Anyone can access files by valid code" ON public.files;
CREATE POLICY "Anyone can access files by valid code" ON public.files
FOR SELECT
USING (
  access_code IS NOT NULL 
  AND is_accessed = false 
  AND deleted = false 
  AND expires_at > now()
);