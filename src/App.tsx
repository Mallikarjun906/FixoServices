import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import BookService from "./pages/BookService";
import MyBookings from "./pages/MyBookings";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import TrackBooking from "./pages/TrackBooking";
import BookProperty from "./pages/BookProperty";
import MyPropertyBookings from "./pages/MyPropertyBookings";
import PropertyOwnerBookings from "./pages/PropertyOwnerBookings";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import ManageProperties from "./pages/ManageProperties";
import ProviderDashboard from "./pages/ProviderDashboard";
import UserDashboard from "./pages/UserDashboard";
import ProviderRegistration from "./pages/ProviderRegistration";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Force cache refresh

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/services" element={<Services />} />
              <Route path="/book/:serviceId" element={<BookService />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancelled" element={<PaymentCancelled />} />
              <Route path="/track-booking/:bookingId" element={<TrackBooking />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/book-property/:id" element={<BookProperty />} />
              <Route path="/my-property-bookings" element={<MyPropertyBookings />} />
              <Route path="/property-owner-bookings" element={<PropertyOwnerBookings />} />
              <Route path="/manage-properties" element={<ManageProperties />} />
            <Route path="/provider-dashboard" element={<ProviderDashboard />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/provider-registration" element={<ProviderRegistration />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
