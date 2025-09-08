-- Drop policies first, then columns
DROP POLICY IF EXISTS "Anyone can access files by valid code" ON public.files;

-- Remove unnecessary fields
ALTER TABLE public.files DROP COLUMN IF EXISTS is_accessed CASCADE;
ALTER TABLE public.files DROP COLUMN IF EXISTS deleted CASCADE;
ALTER TABLE public.files DROP COLUMN IF EXISTS accessed_at CASCADE;

-- Add simple downloaded status
ALTER TABLE public.files ADD COLUMN downloaded boolean NOT NULL DEFAULT false;

-- Create simple RLS policy
CREATE POLICY "Anyone can access files by valid code" ON public.files
FOR SELECT
USING (
  access_code IS NOT NULL 
  AND downloaded = false 
  AND expires_at > now()
);