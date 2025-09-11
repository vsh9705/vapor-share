import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Upload, Download, Menu, X, LogOut, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";

interface NavigationProps {
  activeTab: 'hero' | 'upload' | 'retrieve' | 'notifications';
  onTabChange: (tab: 'hero' | 'upload' | 'retrieve' | 'notifications') => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUnreadCount();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUnreadCount();
        } else {
          setUnreadCount(0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);
      
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center animate-pulse-glow">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-gradient">VaporShare</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant={activeTab === 'hero' ? 'cyber' : 'ghost'}
              onClick={() => onTabChange('hero')}
            >
              Home
            </Button>
            <Button
              variant={activeTab === 'upload' ? 'cyber' : 'ghost'}
              onClick={() => onTabChange('upload')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              variant={activeTab === 'retrieve' ? 'cyber' : 'ghost'}
              onClick={() => onTabChange('retrieve')}
            >
              <Download className="w-4 h-4 mr-2" />
              Retrieve
            </Button>
            {user && (
              <Button
                variant={activeTab === 'notifications' ? 'cyber' : 'ghost'}
                onClick={() => onTabChange('notifications')}
                className="relative"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}
            {user ? (
              <Button variant="glass" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button variant="glass" size="sm" onClick={() => navigate("/auth")}>
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-primary/20 py-4 space-y-2">
            <Button
              variant={activeTab === 'hero' ? 'cyber' : 'ghost'}
              onClick={() => {
                onTabChange('hero');
                setIsMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              Home
            </Button>
            <Button
              variant={activeTab === 'upload' ? 'cyber' : 'ghost'}
              onClick={() => {
                onTabChange('upload');
                setIsMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
            <Button
              variant={activeTab === 'retrieve' ? 'cyber' : 'ghost'}
              onClick={() => {
                onTabChange('retrieve');
                setIsMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Retrieve File
            </Button>
            {user && (
              <Button
                variant={activeTab === 'notifications' ? 'cyber' : 'ghost'}
                onClick={() => {
                  onTabChange('notifications');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start relative"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute right-2 h-5 w-5 p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}
            {user ? (
              <Button variant="glass" size="sm" className="w-full" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button variant="glass" size="sm" className="w-full" onClick={() => navigate("/auth")}>
                Login
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};