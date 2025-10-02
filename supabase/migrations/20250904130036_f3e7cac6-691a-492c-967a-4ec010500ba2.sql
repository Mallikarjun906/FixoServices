-- Fix nested select errors by adding needed unique constraints and foreign keys

-- 1) Ensure profiles.user_id is UNIQUE so it can be referenced
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 2) Allow nesting provider_profiles -> profiles via user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'provider_profiles_user_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.provider_profiles
    ADD CONSTRAINT provider_profiles_user_id_fkey_profiles
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Allow bookings -> provider_profiles nesting via provider_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_provider_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Allow property_bookings -> properties nesting via property_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'property_bookings_property_id_fkey'
  ) THEN
    ALTER TABLE public.property_bookings
    ADD CONSTRAINT property_bookings_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;
END $$;