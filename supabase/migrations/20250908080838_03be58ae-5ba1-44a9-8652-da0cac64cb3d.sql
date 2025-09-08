-- Simplify the files table - remove unnecessary fields and add simple downloaded status
ALTER TABLE public.files DROP COLUMN IF EXISTS is_accessed;
ALTER TABLE public.files DROP COLUMN IF EXISTS deleted;
ALTER TABLE public.files DROP COLUMN IF EXISTS accessed_at;
ALTER TABLE public.files ADD COLUMN downloaded boolean NOT NULL DEFAULT false;

-- Update RLS policy for simple logic
DROP POLICY IF EXISTS "Anyone can access files by valid code" ON public.files;
CREATE POLICY "Anyone can access files by valid code" ON public.files
FOR SELECT
USING (
  access_code IS NOT NULL 
  AND downloaded = false 
  AND expires_at > now()
);