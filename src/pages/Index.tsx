import { WalletProvider } from '@/components/WalletProvider';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { CreatePost } from '@/components/CreatePost';
import { StoryFeed } from '@/components/StoryFeed';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <WalletProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <Hero />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <CreatePost />
            <StoryFeed />
          </div>
        </main>
        <Footer />
      </div>
    </WalletProvider>
  );
};

export default Index;
