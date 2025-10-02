-- Create provider_locations table for real-time location tracking
CREATE TABLE public.provider_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  booking_id UUID,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  heading DECIMAL(5, 2),
  speed DECIMAL(8, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Providers can update their own location" 
ON public.provider_locations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM provider_profiles 
  WHERE provider_profiles.id = provider_locations.provider_id 
  AND provider_profiles.user_id = auth.uid()
));

CREATE POLICY "Customers can view location of their booked provider" 
ON public.provider_locations 
FOR SELECT 
USING (
  provider_locations.booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Property customers can view location of their booked provider" 
ON public.provider_locations 
FOR SELECT 
USING (
  provider_locations.booking_id IN (
    SELECT id FROM property_bookings WHERE tenant_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_provider_locations_updated_at
BEFORE UPDATE ON public.provider_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add table to realtime publication
ALTER publication supabase_realtime ADD TABLE provider_locations;