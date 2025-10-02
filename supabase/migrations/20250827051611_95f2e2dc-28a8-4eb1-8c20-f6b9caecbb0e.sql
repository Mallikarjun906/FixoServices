-- Fix the function search path security issue for the newly created function
CREATE OR REPLACE FUNCTION public.create_stripe_checkout_session(
  booking_id uuid,
  customer_email text,
  amount numeric,
  service_name text
) 
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- This function will be called by the edge function
  -- It's a placeholder for the actual Stripe integration
  result := json_build_object(
    'success', true,
    'booking_id', booking_id,
    'customer_email', customer_email,
    'amount', amount,
    'service_name', service_name
  );
  
  RETURN result;
END;
$$;