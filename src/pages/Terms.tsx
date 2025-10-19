import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Terms = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Terms of Use</h1>
          <div className="text-sm sm:text-base text-muted-foreground">
            <p>Terms of use content coming soon.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
