import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Shield, AlertTriangle, CheckCircle, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const FileRetrieval = () => {
  const [shareCode, setShareCode] = useState("");
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const { toast } = useToast();

  const handleRetrieve = () => {
    if (!shareCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid share code.",
        variant: "destructive",
      });
      return;
    }

    setIsRetrieving(true);
    
    // Simulate file retrieval
    setTimeout(() => {
      const mockFiles = [
        { name: "confidential-report.pdf", size: "2.4 MB", type: "PDF Document" },
        { name: "secure-image.jpg", size: "1.8 MB", type: "Image" },
        { name: "sensitive-data.xlsx", size: "856 KB", type: "Spreadsheet" },
      ];
      
      const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
      setFileInfo(randomFile);
      setIsRetrieving(false);
    }, 1500);
  };

  const handleDownload = () => {
    // Simulate download
    toast({
      title: "Download started",
      description: "File is being decrypted and downloaded.",
    });

    setTimeout(() => {
      setIsDownloaded(true);
      toast({
        title: "File self-destructed",
        description: "The file has been permanently deleted from our servers.",
      });
    }, 2000);
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
                  placeholder="Enter 6-digit code"
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                  className="text-center text-xl font-mono tracking-widest bg-secondary/50 border-primary/30"
                  maxLength={6}
                />
              </div>
              
              <Button
                variant="cyber"
                size="lg"
                onClick={handleRetrieve}
                disabled={isRetrieving || shareCode.length !== 6}
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
                    <span className="font-mono">{fileInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{fileInfo.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{fileInfo.size}</span>
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