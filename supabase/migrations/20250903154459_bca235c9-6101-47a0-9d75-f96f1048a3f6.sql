-- Fix: Restrict public access to sensitive user data in profiles
-- 1) Drop the overly permissive policy that allows everyone to view all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Note: The secure "Users can view their own profile" policy already exists, which is perfect for security