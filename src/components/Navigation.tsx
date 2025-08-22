import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Upload, Download, Menu, X } from "lucide-react";

interface NavigationProps {
  activeTab: 'hero' | 'upload' | 'retrieve';
  onTabChange: (tab: 'hero' | 'upload' | 'retrieve') => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Button variant="glass" size="sm">
              Login
            </Button>
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
            <Button variant="glass" size="sm" className="w-full">
              Login
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};