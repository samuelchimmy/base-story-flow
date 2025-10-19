import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Mail, Globe } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 md:p-10 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Privacy Policy</h1>
            
            <div className="space-y-4 sm:space-y-5 text-xs sm:text-sm text-muted-foreground text-left">
              <div className="text-center space-y-1">
                <p className="text-[10px] sm:text-xs">Effective Date: October 19, 2025</p>
                <p className="text-[10px] sm:text-xs">App Name: BaseStory</p>
                <p className="text-[10px] sm:text-xs">Platform: Built on Base Network</p>
              </div>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  1. Introduction
                </h2>
                <p className="leading-relaxed">
                  BaseStory is a decentralized social platform that allows creators to post anonymous confessions, host AMA sessions, and receive tips from their followers all powered by Base Universal Accounts.
                </p>
                <p className="leading-relaxed mt-2">
                  This Privacy Policy explains how we collect, use, and protect your data when you interact with BaseStory. By using our app, you agree to the practices described here.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  2. What We Collect
                </h2>
                <p className="leading-relaxed mb-2">
                  We collect minimal data necessary to make BaseStory work seamlessly and securely.
                </p>
                
                <h3 className="font-semibold text-foreground mb-1 text-xs sm:text-sm">a. Information You Provide</h3>
                <ul className="list-none space-y-1 mb-2">
                  <li>• <strong>Wallet Address:</strong> We use your Base Universal Account to identify and process tips and activity on the app.</li>
                  <li>• <strong>AMA Settings & Content:</strong> Any AMA titles, descriptions, and messages you post or receive (depending on visibility settings).</li>
                  <li>• <strong>Tips & Transactions:</strong> Details of onchain transactions such as tip amounts, sender/receiver wallet addresses, and timestamps (stored on Base blockchain).</li>
                </ul>

                <h3 className="font-semibold text-foreground mb-1 text-xs sm:text-sm">b. Automatically Collected Information</h3>
                <ul className="list-none space-y-1">
                  <li>• <strong>Device Metadata:</strong> Non-identifiable data such as device type, browser type, and OS for performance optimization.</li>
                  <li>• <strong>Analytics Data:</strong> Aggregated insights on app usage (e.g., number of confessions, AMA sessions, and tips).</li>
                </ul>
                <p className="leading-relaxed mt-2">
                  We do not collect personal identifiers such as real names, emails, or contact details unless explicitly provided by you (e.g., for support).
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  3. Anonymity and Data on the Blockchain
                </h2>
                <p className="leading-relaxed mb-2">
                  BaseStory uses Base Universal Accounts to manage anonymous user interactions.
                </p>
                <ul className="list-none space-y-1">
                  <li>• We never have access to your private keys or custodial wallet data.</li>
                  <li>• Onchain transactions are public by design and may be viewable via Base block explorers.</li>
                  <li>• However, no real-world personal identity is linked to your wallet by us.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  4. How We Use Your Data
                </h2>
                <p className="leading-relaxed mb-2">We use collected data to:</p>
                <ul className="list-none space-y-1 mb-2">
                  <li>• Enable anonymous posting and AMA sessions.</li>
                  <li>• Facilitate tipping and reward distribution.</li>
                  <li>• Improve app features and performance.</li>
                  <li>• Ensure compliance with platform or regulatory requirements.</li>
                </ul>
                <p className="leading-relaxed">
                  We never sell, rent, or trade your data for advertising or profiling purposes.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  5. Data Storage and Retention
                </h2>
                <ul className="list-none space-y-1 mb-2">
                  <li>• <strong>Onchain Data:</strong> Stored permanently on the Base blockchain (immutable).</li>
                  <li>• <strong>Offchain Data:</strong> Minimal session data or metadata may be stored temporarily on secure servers to improve performance.</li>
                </ul>
                <p className="leading-relaxed">
                  We retain only essential data for as long as needed for the app to function properly.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  6. Your Rights
                </h2>
                <p className="leading-relaxed mb-2">
                  Depending on your jurisdiction (e.g., GDPR or CCPA), you may have the right to:
                </p>
                <ul className="list-none space-y-1 mb-2">
                  <li>• Request information about what data we hold.</li>
                  <li>• Withdraw consent for data processing.</li>
                </ul>
                <p className="leading-relaxed flex items-center gap-1 flex-wrap">
                  To exercise these rights, contact us at{' '}
                  <a href="mailto:privacy@basestory.app" className="text-primary hover:underline inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    privacy@basestory.app
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  7. Security
                </h2>
                <p className="leading-relaxed mb-2">
                  We implement industry-standard encryption, secure access protocols, and decentralized architecture to protect your data.
                  However, since BaseStory operates partially on the blockchain, we cannot modify or delete onchain data once published.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  8. Third-Party Services
                </h2>
                <p className="leading-relaxed mb-2">
                  BaseStory may integrate with third-party tools such as:
                </p>
                <ul className="list-none space-y-1 mb-2">
                  <li>• <strong>Base Network:</strong> for blockchain transactions.</li>
                  <li>• <strong>Analytics providers:</strong> for non-personal app usage insights.</li>
                </ul>
                <p className="leading-relaxed">
                  These services have their own privacy policies. We recommend reviewing them before use.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  9. Children's Privacy
                </h2>
                <p className="leading-relaxed">
                  BaseStory is intended for users aged 18 and above. We do not knowingly collect data from minors.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  10. Changes to this Policy
                </h2>
                <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time. The latest version will always be available within the app and on our website. Continued use of BaseStory constitutes acceptance of any changes.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  11. Contact Us
                </h2>
                <p className="leading-relaxed mb-2">
                  For privacy inquiries, requests, or concerns, please contact:
                </p>
                <p className="leading-relaxed flex items-center gap-1 flex-wrap">
                  <a href="mailto:privacy@basestory.app" className="text-primary hover:underline inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    privacy@basestory.app
                  </a>
                </p>
                <p className="leading-relaxed flex items-center gap-1 flex-wrap">
                  <a href="https://www.basestory.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    www.basestory.app
                  </a>
                </p>
              </section>

              <section className="pt-2 text-center">
                <p className="text-sm sm:text-base font-medium text-foreground">
                  BaseStory Say what you can't. Earn while you do. Stay anonymous.
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

export default Privacy;
