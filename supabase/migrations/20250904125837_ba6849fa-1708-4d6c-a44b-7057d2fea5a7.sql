-- Add missing foreign key relationships to fix the database errors

-- Add foreign key relationship between provider_profiles and profiles
ALTER TABLE public.provider_profiles 
ADD CONSTRAINT fk_provider_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key relationship between property_bookings and properties
ALTER TABLE public.property_bookings 
ADD CONSTRAINT property_bookings_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- Add foreign key relationship between bookings and services
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

-- Add foreign key relationship between bookings and provider_profiles
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_provider_id_fkey 
FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE SET NULL;