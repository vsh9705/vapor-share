import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Shield, AlertTriangle, CheckCircle, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const FileRetrieval = () => {
  const [shareCode, setShareCode] = useState("");
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    id: string;
    filename: string;
    size: number;
    mimeType: string;
    expiresAt: string;
  } | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const { toast } = useToast();

  const handleRetrieve = async () => {
    if (!shareCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid share code.",
        variant: "destructive",
      });
      return;
    }

    setIsRetrieving(true);
    
    try {
      const response = await supabase.functions.invoke('retrieve-file', {
        body: { accessCode: shareCode.trim().toUpperCase() },
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || response.error?.message || 'Failed to retrieve file');
      }

      setFileInfo(response.data.file);
      toast({
        title: "File found!",
        description: "File is ready for download.",
      });
    } catch (error: any) {
      console.error('Retrieve error:', error);
      toast({
        title: "File not found",
        description: error.message || "Invalid or expired access code.",
        variant: "destructive",
      });
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleDownload = async () => {
    if (!fileInfo) return;

    try {
      toast({
        title: "Download starting",
        description: "Preparing secure download...",
      });

      // Open download URL using Supabase function invoke
      const downloadUrl = `https://mhhfaxbrwefmsmxvtoah.supabase.co/functions/v1/retrieve-file?code=${shareCode.trim().toUpperCase()}`;
      window.open(downloadUrl, '_blank');

      // Wait a bit then mark as downloaded
      setTimeout(() => {
        setIsDownloaded(true);
        toast({
          title: "File self-destructed",
          description: "The file has been permanently deleted from our servers.",
        });
      }, 3000);
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "An error occurred during download",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setShareCode("");
    setFileInfo(null);
    setIsDownloaded(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Code Input */}
      <Card className="glass-card p-8">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
            <Download className="w-10 h-10 text-primary" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-4">Retrieve Secure File</h2>
            <p className="text-muted-foreground">
              Enter the share code to access your self-destructing file
            </p>
          </div>

          {!fileInfo && !isDownloaded && (
            <div className="space-y-4">
              <div className="max-w-sm mx-auto">
                <Input
                  placeholder="Enter 8-digit code"
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                  className="text-center text-xl font-mono tracking-widest bg-secondary/50 border-primary/30"
                  maxLength={8}
                />
              </div>
              
              <Button
                variant="cyber"
                size="lg"
                onClick={handleRetrieve}
                disabled={isRetrieving || shareCode.length !== 8}
                className="w-full max-w-xs"
              >
                {isRetrieving ? (
                  <>
                    <Shield className="w-4 h-4 mr-2 animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Retrieve File
                  </>
                )}
              </Button>
            </div>
          )}

          {/* File Info Display */}
          {fileInfo && !isDownloaded && (
            <div className="space-y-6">
              <Card className="glass-card p-6 bg-green-500/5 border-green-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold">File Found</h3>
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-mono">{fileInfo.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{fileInfo.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{(fileInfo.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{new Date(fileInfo.expiresAt).toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              {/* Warning */}
              <Card className="glass-card p-4 bg-yellow-500/5 border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div className="text-left">
                    <p className="font-semibold text-yellow-500">Self-Destruct Warning</p>
                    <p className="text-sm text-muted-foreground">
                      This file will be permanently deleted after download
                    </p>
                  </div>
                </div>
              </Card>

              <Button
                variant="cyber"
                size="lg"
                onClick={handleDownload}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download & Destroy
              </Button>
            </div>
          )}

          {/* Downloaded State */}
          {isDownloaded && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <Timer className="w-10 h-10 text-red-500" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-2 text-red-500">File Self-Destructed</h3>
                <p className="text-muted-foreground">
                  The file has been permanently deleted from our servers and cannot be recovered.
                </p>
              </div>

              <Button variant="glass" onClick={resetForm}>
                Retrieve Another File
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Security Info */}
      <Card className="glass-card p-6">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-primary mt-1" />
          <div>
            <h4 className="font-semibold mb-2">Security Notice</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Files are decrypted in real-time during download</li>
              <li>• Share codes become invalid after first use</li>
              <li>• All file data is permanently wiped from storage</li>
              <li>• Download attempts are logged for security</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};