-- Fix the provider_id constraint in bookings table to allow null values
-- This allows bookings to be created without a provider initially
ALTER TABLE public.bookings ALTER COLUMN provider_id DROP NOT NULL;

-- Also ensure other booking fields can handle the payment flow properly
ALTER TABLE public.bookings ALTER COLUMN customer_address DROP NOT NULL;