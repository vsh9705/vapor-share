import { Button } from "@/components/ui/button";
import { Shield, Lock, Timer, Zap } from "lucide-react";
import heroImage from "@/assets/hero-cyber.jpg";

export const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-background/40" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float">
        <div className="glass-card p-4 rounded-lg">
          <Shield className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '1s' }}>
        <div className="glass-card p-4 rounded-lg">
          <Lock className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-40 left-20 animate-float" style={{ animationDelay: '2s' }}>
        <div className="glass-card p-4 rounded-lg">
          <Timer className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
        <div className="glass-card p-8 lg:p-12 rounded-3xl backdrop-blur-xl">
          <h1 className="text-5xl lg:text-7xl font-bold mb-6">
            <span className="text-gradient">VaporShare</span>
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground mb-4">
            Secure file sharing with self-destruct technology
          </p>
          <p className="text-lg text-muted-foreground/80 mb-8 max-w-2xl mx-auto">
            Share files that automatically delete after one download. Perfect for sensitive documents, 
            private photos, and confidential information that should never leave a trace.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="cyber" className="text-lg px-8 py-4">
              <Zap className="w-5 h-5 mr-2" />
              Start Sharing Securely
            </Button>
            <Button size="lg" variant="glass" className="text-lg px-8 py-4">
              <Lock className="w-5 h-5 mr-2" />
              Retrieve File
            </Button>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Military-Grade Security</h3>
              <p className="text-sm text-muted-foreground">End-to-end encryption ensures your files stay private</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow" style={{ animationDelay: '0.5s' }}>
                <Timer className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Self-Destruct Files</h3>
              <p className="text-sm text-muted-foreground">Files automatically delete after one download</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow" style={{ animationDelay: '1s' }}>
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Sharing</h3>
              <p className="text-sm text-muted-foreground">Generate secure codes and share instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};