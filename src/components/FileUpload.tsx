import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, File, Copy, CheckCircle, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const FileUpload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [shareCode, setShareCode] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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
    simulateUpload();
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      // Generate a mock share code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setShareCode(code);
      setIsUploading(false);
      toast({
        title: "File uploaded successfully!",
        description: "Your secure share code has been generated.",
      });
    }, 2000);
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
                Drag and drop a file or click to browse. Max size: 100MB
              </p>
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
              <li>• Files are encrypted with AES-256 before upload</li>
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