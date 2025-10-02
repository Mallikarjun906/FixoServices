import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Create checkout function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "https://jtyduhrvoqxoxxgsgvgu.supabase.co",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eWR1aHJ2b3F4b3h4Z3Nndmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTQ0NjQsImV4cCI6MjA3MTc5MDQ2NH0.JN3ox6dx6568SFug5--jD84T1C4HLEOHcmRiHRXapco"
  );

  try {
    console.log("Parsing request body...");
    const { bookingId, amount, serviceName, customerEmail } = await req.json();
    console.log("Request data:", { bookingId, amount, serviceName, customerEmail });

    // Verify user from auth token if provided
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      console.log("Verifying auth token...");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError) {
        console.log("Auth error:", authError.message);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      user = userData.user;
      console.log("User authenticated:", user?.email);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) {
      console.log("ERROR: Stripe secret key not configured");
      throw new Error("Stripe secret key not configured");
    }
    console.log("Stripe key found");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Lookup or create a customer by email
    let customerId: string | undefined;
    if (customerEmail) {
      console.log("Looking up Stripe customer by email:", customerEmail);
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("Found existing customer:", customerId);
      } else {
        console.log("No existing customer found");
      }
    }

    console.log("Creating Stripe checkout session...");
    const amountInPaise = Math.round(Number(amount) * 100);
    console.log("Amount in paise:", amountInPaise);
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: serviceName || "Service" },
            // Convert INR to smallest unit (paise) - multiply by 100
            unit_amount: amountInPaise,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-cancelled`,
      metadata: { bookingId: bookingId || "" },
    });

    console.log("Checkout session created successfully:", session.id);
    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("ERROR in create-checkout:", message);
    console.log("Full error:", err);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});