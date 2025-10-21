import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Share2, Link } from 'lucide-react';
import farcasterIcon from '/farcaster-icon.svg';
import baseIcon from '/base-app-icon.jpg';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  text: string;
  url: string;
}

export const ShareDialog = ({ open, onOpenChange, title, text, url }: ShareDialogProps) => {
  const shareOptions = [
    {
      name: 'Farcaster',
      icon: <img src={farcasterIcon} alt="Farcaster" className="w-6 h-6" />,
      action: () => {
        window.open(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`,
          '_blank'
        );
      },
    },
    {
      name: 'Base',
      icon: <img src={baseIcon} alt="Base" className="w-6 h-6 rounded" />,
      action: () => {
        window.open(
          `https://base.org/share?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          '_blank'
        );
      },
    },
    {
      name: 'Twitter',
      icon: <span className="text-2xl">𝕏</span>,
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          '_blank'
        );
      },
    },
    {
      name: 'Copy Link',
      icon: <Link className="w-5 h-5" />,
      action: () => {
        navigator.clipboard.writeText(url);
        onOpenChange(false);
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              variant="outline"
              className="flex items-center gap-2 justify-center h-auto py-4"
              onClick={option.action}
            >
              {option.icon}
              <span>{option.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
