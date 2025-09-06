import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FileUpload } from "@/components/FileUpload";
import { FileRetrieval } from "@/components/FileRetrieval";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'hero' | 'upload' | 'retrieve'>('hero');

  const renderContent = () => {
    switch (activeTab) {
      case 'hero':
        return <Hero />;
      case 'upload':
        return (
          <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  <span className="text-gradient">Upload Secure File</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Encrypt and share files that self-destruct after one download. 
                  Perfect for sensitive documents that need secure, temporary sharing.
                </p>
              </div>
              <FileUpload />
            </div>
          </div>
        );
      case 'retrieve':
        return (
          <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  <span className="text-gradient">Retrieve Secure File</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Enter your secure access code to download and permanently destroy the file. 
                  Remember: files can only be downloaded once.
                </p>
              </div>
              <FileRetrieval />
            </div>
          </div>
        );
      default:
        return <Hero />;
    }
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <title>
        {activeTab === 'upload' 
          ? 'Upload Secure File - VaporShare' 
          : activeTab === 'retrieve' 
          ? 'Retrieve File - VaporShare' 
          : 'VaporShare - Secure Self-Destruct File Sharing'
        }
      </title>
      
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {renderContent()}
      </main>

    </>
  );
};

export default Index;