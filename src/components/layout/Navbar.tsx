import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, Wrench } from "lucide-react";

const Navbar = () => {
  const { user, signOut, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">Fixo</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost">About</Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost">Contact Us</Button>
            </Link>
            <Link to="/services">
              <Button variant="ghost">Services</Button>
            </Link>
            <Link to="/properties">
              <Button variant="ghost">Properties</Button>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
              {userProfile?.user_type === 'provider' && (
                <Link to="/provider-dashboard">
                  <Button variant="ghost">Provider Dashboard</Button>
                </Link>
              )}
              {userProfile?.user_type === 'customer' && (
                <Link to="/user-dashboard">
                  <Button variant="ghost">My Dashboard</Button>
                </Link>
              )}
                
                {userProfile?.user_type === 'admin' && (
                  <Link to="/admin">
                    <Button variant="ghost">Admin Panel</Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile?.avatar_url} />
                        <AvatarFallback>
                          {userProfile?.full_name?.charAt(0) || user.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    {userProfile?.user_type === 'provider' ? (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/provider-dashboard')}>
                          <User className="mr-2 h-4 w-4" />
                          Provider Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/bookings')}>
                          <User className="mr-2 h-4 w-4" />
                          My Service Bookings
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/user-dashboard')}>
                          <User className="mr-2 h-4 w-4" />
                          My Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/bookings')}>
                          <User className="mr-2 h-4 w-4" />
                          My Service Bookings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/my-property-bookings')}>
                          <User className="mr-2 h-4 w-4" />
                          My Property Bookings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/manage-properties')}>
                          <Settings className="mr-2 h-4 w-4" />
                          My Properties
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/payment')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth?mode=signin">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;