-- Add PAN card authentication fields to provider profiles
ALTER TABLE public.provider_profiles 
ADD COLUMN pan_card_number TEXT,
ADD COLUMN pan_card_image_url TEXT,
ADD COLUMN pan_verification_status TEXT DEFAULT 'pending' CHECK (pan_verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN pan_verified_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX idx_provider_profiles_pan_verification ON public.provider_profiles(pan_verification_status);
CREATE INDEX idx_provider_profiles_user_id ON public.provider_profiles(user_id);