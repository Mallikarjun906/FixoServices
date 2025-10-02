import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-600">Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Your payment was cancelled. No charges have been made to your account.
            </p>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="text-sm text-muted-foreground text-left space-y-1">
                <li>• Your booking is still pending payment</li>
                <li>• You can retry payment anytime from your bookings page</li>
                <li>• The service provider has been notified of the pending payment</li>
                <li>• Your booking will be automatically cancelled if payment isn't completed within 24 hours</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/bookings')}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
              
              <Button 
                onClick={() => navigate('/services')}
                variant="outline"
                className="w-full"
              >
                Browse More Services
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>Need help? Contact our support team for assistance.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCancelled;