-- Create property_bookings table for rental bookings
CREATE TABLE public.property_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  tenant_notes TEXT,
  owner_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.property_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for property_bookings
CREATE POLICY "Tenants can view their own property bookings" 
ON public.property_bookings 
FOR SELECT 
USING (auth.uid() = tenant_id);

CREATE POLICY "Property owners can view bookings for their properties" 
ON public.property_bookings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = property_bookings.property_id 
  AND properties.owner_id = auth.uid()
));

CREATE POLICY "Tenants can create property bookings" 
ON public.property_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update their own property bookings" 
ON public.property_bookings 
FOR UPDATE 
USING (auth.uid() = tenant_id);

CREATE POLICY "Property owners can update bookings for their properties" 
ON public.property_bookings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.properties 
  WHERE properties.id = property_bookings.property_id 
  AND properties.owner_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_property_bookings_updated_at
BEFORE UPDATE ON public.property_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();