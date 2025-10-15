export const Footer = () => {
  return (
    <footer className="w-full py-6 sm:py-8 border-t border-border mt-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Built with 💙 by{' '}
          <a
            href="https://www.0xnotes.lol/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium transition-colors"
          >
            Jadeofwallstreet
          </a>
        </p>
      </div>
    </footer>
  );
};
