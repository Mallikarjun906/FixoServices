-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL DEFAULT 'customer' CHECK (user_type IN ('customer', 'provider', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service categories table
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provider profiles table
CREATE TABLE public.provider_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  description TEXT,
  experience_years INTEGER,
  rating DECIMAL(3,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provider services junction table
CREATE TABLE public.provider_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, service_id)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_notes TEXT,
  provider_notes TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for service categories (public read)
CREATE POLICY "Service categories are viewable by everyone" 
ON public.service_categories FOR SELECT USING (true);

CREATE POLICY "Only admins can manage service categories" 
ON public.service_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);

-- Create RLS policies for services (public read)
CREATE POLICY "Services are viewable by everyone" 
ON public.services FOR SELECT USING (true);

CREATE POLICY "Only admins can manage services" 
ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);

-- Create RLS policies for provider profiles
CREATE POLICY "Provider profiles are viewable by everyone" 
ON public.provider_profiles FOR SELECT USING (true);

CREATE POLICY "Providers can update their own profile" 
ON public.provider_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert their own profile" 
ON public.provider_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for provider services
CREATE POLICY "Provider services are viewable by everyone" 
ON public.provider_services FOR SELECT USING (true);

CREATE POLICY "Providers can manage their own services" 
ON public.provider_services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid())
);

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings as customer" 
ON public.bookings FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Providers can view their own bookings" 
ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid())
);

CREATE POLICY "Customers can create bookings" 
ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own bookings" 
ON public.bookings FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Providers can update bookings assigned to them" 
ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid())
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample service categories
INSERT INTO public.service_categories (name, description) VALUES
('Home Cleaning', 'Professional home cleaning services'),
('Plumbing', 'Plumbing repair and installation services'),
('Electrical', 'Electrical repair and installation services'),
('Appliance Repair', 'Home appliance repair services'),
('Painting', 'Interior and exterior painting services'),
('Gardening', 'Garden maintenance and landscaping services');

-- Insert sample services
INSERT INTO public.services (category_id, name, description, base_price, duration_minutes) VALUES
((SELECT id FROM public.service_categories WHERE name = 'Home Cleaning'), 'Deep House Cleaning', 'Complete deep cleaning of your home', 150.00, 180),
((SELECT id FROM public.service_categories WHERE name = 'Home Cleaning'), 'Regular House Cleaning', 'Regular maintenance cleaning', 80.00, 120),
((SELECT id FROM public.service_categories WHERE name = 'Plumbing'), 'Pipe Repair', 'Fix leaking or broken pipes', 120.00, 90),
((SELECT id FROM public.service_categories WHERE name = 'Plumbing'), 'Toilet Installation', 'Install new toilet fixtures', 200.00, 120),
((SELECT id FROM public.service_categories WHERE name = 'Electrical'), 'Wiring Repair', 'Electrical wiring repair and maintenance', 180.00, 120),
((SELECT id FROM public.service_categories WHERE name = 'Electrical'), 'Light Fixture Installation', 'Install ceiling fans and light fixtures', 100.00, 60);