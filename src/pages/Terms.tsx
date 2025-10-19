import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Mail, Globe } from 'lucide-react';

const Terms = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 md:p-10 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Terms of Use</h1>
            
            <div className="space-y-4 sm:space-y-5 text-xs sm:text-sm text-muted-foreground text-left">
              <div className="text-center space-y-1">
                <p className="text-[10px] sm:text-xs">Effective Date: October 19, 2025</p>
                <p className="text-[10px] sm:text-xs">App Name: BaseStory</p>
                <p className="text-[10px] sm:text-xs">Platform: Built on Base Network</p>
              </div>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  1. Acceptance of Terms
                </h2>
                <p className="leading-relaxed mb-2">
                  BaseStory is a decentralized social app where creators can post anonymous confessions, host AMA sessions, and earn tips all powered by Base Universal Accounts.
                </p>
                <p className="leading-relaxed">
                  By accessing or using BaseStory, you agree to be bound by these Terms of Use and all applicable laws. If you do not agree, please do not use the app.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  2. Eligibility
                </h2>
                <p className="leading-relaxed mb-2">To use BaseStory, you must:</p>
                <ul className="list-none space-y-1">
                  <li>• Be at least 18 years old or the legal age of majority in your jurisdiction.</li>
                  <li>• Have full legal capacity to enter into binding agreements.</li>
                  <li>• Use your own Base Universal Account or compatible wallet.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  3. Nature of the Platform
                </h2>
                <ul className="list-none space-y-1">
                  <li>• BaseStory is a decentralized platform built on the Base blockchain.</li>
                  <li>• We do not control, store, or have access to user wallets or private keys.</li>
                  <li>• Transactions (such as tips) are executed onchain and cannot be reversed.</li>
                  <li>• All content and activity are recorded on Base's public infrastructure and may be viewable via blockchain explorers.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  4. User Responsibilities
                </h2>
                <p className="leading-relaxed mb-2">By using BaseStory, you agree to:</p>
                <ul className="list-none space-y-1 mb-2">
                  <li>• Post content responsibly no hate speech, harassment, impersonation, or illegal content.</li>
                  <li>• Respect the anonymity of others and not attempt to de-anonymize users.</li>
                  <li>• Refrain from exploiting the platform for fraud, scams, or money laundering.</li>
                  <li>• Comply with all applicable laws and regulations in your country.</li>
                </ul>
                <p className="leading-relaxed">
                  You are solely responsible for the content you post and any onchain transactions made through your wallet.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  5. Prohibited Content
                </h2>
                <p className="leading-relaxed mb-2">You may not post or distribute content that:</p>
                <ul className="list-none space-y-1 mb-2">
                  <li>• Promotes violence, discrimination, or illegal activity.</li>
                  <li>• Contains sexually explicit, abusive, or defamatory material.</li>
                  <li>• Attempts to collect or expose personal information of others.</li>
                  <li>• Infringes on any intellectual property or privacy rights.</li>
                </ul>
                <p className="leading-relaxed">
                  Violation of these terms may result in restriction, suspension, or removal of your access to BaseStory.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  6. Anonymous Posting and AMAs
                </h2>
                <p className="leading-relaxed mb-2">
                  BaseStory allows for anonymous posting and anonymous AMA sessions. While your identity remains hidden from other users, all activity is tied to your Base Universal Account address.
                </p>
                <ul className="list-none space-y-1 mb-2">
                  <li>• You may set tip amounts or make AMA messages public or private.</li>
                  <li>• Messages shared publicly may be viewable by anyone with the link.</li>
                </ul>
                <p className="leading-relaxed">
                  We are not responsible for any content shared outside the platform by third parties.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  7. Payments and Tips
                </h2>
                <ul className="list-none space-y-1">
                  <li>• All payments are processed onchain via Base Network.</li>
                  <li>• Tips are voluntary and non-refundable.</li>
                  <li>• BaseStory does not hold user funds or provide escrow services.</li>
                  <li>• Network fees (gas) apply and are determined by the Base blockchain.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  8. Intellectual Property
                </h2>
                <p className="leading-relaxed mb-2">
                  All rights to the BaseStory brand, name, logo, and platform features belong to BaseStory. However, you retain ownership of your own content. By posting, you grant BaseStory a limited, non-exclusive, royalty-free license to display your content within the app.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  9. Disclaimer of Warranties
                </h2>
                <p className="leading-relaxed mb-2">
                  BaseStory is provided "as is" and "as available." We make no guarantees that the platform will be error-free, uninterrupted, or fully secure. Use of blockchain inherently involves risks such as wallet compromise, volatility, and irreversible transactions by using BaseStory, you acknowledge these risks.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  10. Limitation of Liability
                </h2>
                <p className="leading-relaxed mb-2">To the fullest extent permitted by law:</p>
                <ul className="list-none space-y-1">
                  <li>• BaseStory and its developers shall not be liable for any loss, damage, or claim arising from your use of the platform.</li>
                  <li>• This includes losses related to blockchain transactions, tips, data exposure, or third-party interactions.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  11. Account Termination
                </h2>
                <p className="leading-relaxed mb-2">
                  We reserve the right to suspend or terminate access to any user who violates these Terms or misuses the platform. Since BaseStory uses decentralized wallets, termination may limit only your ability to interact with the app's interface not your onchain activity.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  12. Changes to the Terms
                </h2>
                <p className="leading-relaxed">
                  We may update these Terms periodically. Updates will be published on our app or website, and continued use of BaseStory after changes means you accept the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  13. Governing Law
                </h2>
                <p className="leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of [Insert Country or Jurisdiction], without regard to conflict of law principles.
                </p>
              </section>

              <section className="text-center">
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  Contact Us
                </h2>
                <p className="leading-relaxed mb-2">
                  For questions or concerns regarding these Terms, contact us at:
                </p>
                <p className="leading-relaxed flex items-center justify-center gap-1 flex-wrap mb-1">
                  <a href="mailto:legal@basestory.app" className="text-primary hover:underline inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    legal@basestory.app
                  </a>
                </p>
                <p className="leading-relaxed flex items-center justify-center gap-1 flex-wrap">
                  <a href="https://www.basestory.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    www.basestory.app
                  </a>
                </p>
              </section>

              <section className="pt-2 text-center">
                <p className="text-sm sm:text-base font-medium text-foreground">
                  BaseStory Say it. Earn it. Stay anonymous.
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

export default Terms;
