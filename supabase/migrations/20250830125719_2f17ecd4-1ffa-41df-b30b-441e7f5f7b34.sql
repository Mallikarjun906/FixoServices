-- Fix RLS policies for provider_locations to allow INSERT/UPDATE by providers
-- Allow INSERT
CREATE POLICY "Providers can insert their own location"
ON public.provider_locations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM provider_profiles
    WHERE provider_profiles.id = provider_locations.provider_id
      AND provider_profiles.user_id = auth.uid()
  )
);

-- Allow UPDATE (both USING and WITH CHECK)
CREATE POLICY "Providers can update their own location rows"
ON public.provider_locations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM provider_profiles
    WHERE provider_profiles.id = provider_locations.provider_id
      AND provider_profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM provider_profiles
    WHERE provider_profiles.id = provider_locations.provider_id
      AND provider_profiles.user_id = auth.uid()
  )
);
