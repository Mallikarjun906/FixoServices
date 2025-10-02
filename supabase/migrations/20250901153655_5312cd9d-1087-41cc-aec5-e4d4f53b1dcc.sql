-- Add new service categories for Carpentry and Consultation
INSERT INTO public.service_categories (name, description) VALUES 
('Carpentry', 'Professional carpentry and woodworking services'),
('Consultation', 'Expert consultation and advisory services');

-- Add carpenter services
WITH carpentry_category AS (
  SELECT id FROM service_categories WHERE name = 'Carpentry'
)
INSERT INTO public.services (name, description, base_price, duration_minutes, category_id) 
SELECT 
  service_name,
  service_description,
  service_price,
  service_duration,
  carpentry_category.id
FROM carpentry_category,
(VALUES 
  ('Custom Furniture Building', 'Build custom furniture pieces to your specifications', 300.00, 240),
  ('Cabinet Installation', 'Install kitchen and bathroom cabinets', 250.00, 180),
  ('Door and Window Installation', 'Install new doors and windows', 200.00, 120),
  ('Deck Construction', 'Build outdoor decks and patios', 400.00, 300),
  ('Shelving Installation', 'Install custom shelving units', 150.00, 90)
) AS services_data(service_name, service_description, service_price, service_duration);

-- Add consultation services
WITH consultation_category AS (
  SELECT id FROM service_categories WHERE name = 'Consultation'
)
INSERT INTO public.services (name, description, base_price, duration_minutes, category_id)
SELECT 
  service_name,
  service_description,
  service_price,
  service_duration,
  consultation_category.id
FROM consultation_category,
(VALUES 
  ('Home Renovation Consultation', 'Expert advice on home renovation projects', 100.00, 60),
  ('Interior Design Consultation', 'Professional interior design guidance', 120.00, 90),
  ('Property Investment Consultation', 'Investment advice for property purchases', 150.00, 60),
  ('Home Maintenance Planning', 'Create a comprehensive maintenance schedule', 80.00, 45),
  ('Energy Efficiency Assessment', 'Evaluate and recommend energy-saving improvements', 130.00, 75)
) AS services_data(service_name, service_description, service_price, service_duration);