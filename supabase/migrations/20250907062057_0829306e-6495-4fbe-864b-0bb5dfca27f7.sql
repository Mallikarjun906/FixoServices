-- Create a provider profile for the existing provider user
INSERT INTO provider_profiles (
    user_id,
    business_name,
    description,
    experience_years,
    is_available,
    is_verified,
    total_bookings,
    rating
) VALUES (
    '37340b9a-b26a-4980-af41-29f34c8fb7ac',
    'Mallu Services',
    'Professional home services provider',
    2,
    true,
    true,
    0,
    0
) ON CONFLICT (user_id) DO NOTHING;