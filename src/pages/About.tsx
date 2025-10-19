import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 md:p-10 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">About BaseStory</h1>
            
            <div className="space-y-4 sm:space-y-5 text-xs sm:text-sm text-muted-foreground">
              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  What's BaseStory?
                </h2>
                <p className="leading-relaxed">
                  BaseStory is your onchain confession booth meets creator playground. It's where creators can finally say the things they can't post on X, Base app, Zora, or Farcaster all anonymously and still get tipped for it.
                </p>
              </section>

              <section>
                <p className="leading-relaxed">
                  Got a wild thought, alpha, secret rant, or late-night truth bomb? Drop it anonymously on the public feed and let the crowd tip you for being real.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  Host Your Own Anonymous AMA
                </h2>
                <p className="leading-relaxed mb-2">
                  Want to connect with your followers without the pressure? Create an AMA (Ask Me Anything) session anyone with your link can send you a message anonymously.
                </p>
                <p className="leading-relaxed mb-2">You decide the rules:</p>
                <ul className="list-none space-y-1">
                  <li>Set a tip amount (or make it free)</li>
                  <li>Make replies public (for everyone) or private (just for you)</li>
                </ul>
              </section>

              <section>
                <p className="leading-relaxed">
                  Think NGL.link, but onchain, with real creator rewards, Secured Onchain by Base, and powered by Base Universal Accounts.
                </p>
              </section>

              <section className="pt-2">
                <p className="text-sm sm:text-base font-medium text-foreground">
                  Say what you want. Earn from it. Stay anonymous.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
