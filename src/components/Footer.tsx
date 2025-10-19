import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="w-full py-6 sm:py-8 border-t border-border mt-12">
      <div className="container mx-auto px-4 text-center space-y-4">
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <Link 
            to="/about" 
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link 
            to="/privacy" 
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/terms" 
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Use
          </Link>
        </div>
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
