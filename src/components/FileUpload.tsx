import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, File, Copy, CheckCircle, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";

export const FileUpload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [shareCode, setShareCode] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload files.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsUploading(true);

    try {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File too large. Maximum size is 10MB.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const formData = new FormData();
      formData.append('file', file);
      if (recipientEmail.trim()) {
        formData.append('recipientEmail', recipientEmail.trim());
      }

      const response = await supabase.functions.invoke('upload-file', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Upload failed');
      }

      const { accessCode } = response.data;
      setShareCode(accessCode);
      setIsUploading(false);
      
      toast({
        title: "File uploaded successfully!",
        description: "Your secure share code has been generated.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadedFile(null);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareCode);
    toast({
      title: "Code copied!",
      description: "Share code has been copied to clipboard.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Upload Area */}
      <Card className="glass-card border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300">
        <div
          className={`p-8 text-center transition-all duration-300 ${
            isDragOver ? "bg-primary/5 scale-105" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!uploadedFile && !isUploading && (
            <>
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Drop your file here</h3>
              <p className="text-muted-foreground mb-6">
                Drag and drop a file or click to browse. Max size: 10MB
              </p>
              
              <div className="mb-6">
                <Input
                  type="email"
                  placeholder="Share with email (optional)"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="max-w-sm mx-auto bg-background/50"
                />
              </div>
              <Input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <Button variant="cyber" size="lg" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </>
          )}

          {isUploading && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-spin">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Encrypting and uploading...</h3>
              <p className="text-muted-foreground">Securing your file with military-grade encryption</p>
            </div>
          )}

          {uploadedFile && shareCode && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                  <File className="w-4 h-4" />
                  <span>{uploadedFile.name}</span>
                </div>
              </div>
              
              {/* Share Code Display */}
              <div className="glass-card p-6 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Self-Destruct Code</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareCode}
                    readOnly
                    className="text-center text-xl font-mono tracking-widest bg-secondary/50 border-primary/30"
                  />
                  <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  ⚠️ This file will be permanently deleted after the first download
                </p>
              </div>

              <Button 
                variant="glass" 
                onClick={() => {
                  setUploadedFile(null);
                  setShareCode("");
                  setRecipientEmail("");
                }}
              >
                Upload Another File
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Security Notice */}
      <Card className="glass-card p-6">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-primary mt-1" />
          <div>
            <h4 className="font-semibold mb-2">Security Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Share codes expire after 24 hours</li>
              <li>• Files are permanently deleted after first access</li>
              <li>• No file metadata is stored on our servers</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
