import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { Button } from './ui/button';
import { X, Share2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { toast } from 'sonner';
import { useWallet } from './WalletProvider';
import { publicClient } from '../viemClient';
import { CONTRACT_ADDRESS, CONTRACT_ABI, AMA_CONTRACT_ADDRESS, AMA_CONTRACT_ABI } from '../config';
import { getAllAMAs } from '@/lib/amaHelpers';

export const SessionsDrawer = () => {
  const [open, setOpen] = useState(false);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [userAMAs, setUserAMAs] = useState<any[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const { subAccountAddress } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!subAccountAddress || !activePanel) return;
    
    if (activePanel === 'ama-sessions') {
      fetchUserAMAs();
    }
    if (activePanel === 'story-history') {
      fetchUserStories();
    }
  }, [subAccountAddress, activePanel]);

  const fetchUserStories = async () => {
    if (!subAccountAddress) return;
    try {
      const allStories = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getAllStories',
      } as any);
      const myStories = (allStories as any[]).filter(
        (story: any) => story.author.toLowerCase() === subAccountAddress.toLowerCase() && !story.deleted
      );
      setUserStories(myStories);
    } catch (error) {
      console.error('Failed to fetch user stories:', error);
    }
  };

  const fetchUserAMAs = async () => {
    if (!subAccountAddress) return;
    try {
      const allAMAs = await getAllAMAs();
      const myAMAs = allAMAs.filter(
        (ama) => ama.creator.toLowerCase() === subAccountAddress.toLowerCase()
      );
      setUserAMAs(myAMAs);
    } catch (error) {
      console.error('Failed to fetch user AMAs:', error);
    }
  };

  const copyAMALink = (amaId: string) => {
    const link = `${window.location.origin}/ama/${amaId}`;
    navigator.clipboard.writeText(link);
    toast.success('AMA link copied to clipboard!');
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
        >
          Sessions
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="relative">
          <DrawerTitle className="font-[Bangers] text-2xl">Sessions</DrawerTitle>
          <DrawerDescription>Your AMA sessions and story history</DrawerDescription>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          <Accordion type="single" collapsible className="w-full" onValueChange={(val) => setActivePanel((val as string) || null)}>
            {/* AMA Sessions */}
            <AccordionItem value="ama-sessions">
              <AccordionTrigger className="text-sm font-semibold">
                AMA sessions
              </AccordionTrigger>
              <AccordionContent>
                {!subAccountAddress ? (
                  <p className="text-xs text-muted-foreground">Connect wallet to view your AMAs</p>
                ) : userAMAs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No AMAs created yet</p>
                ) : (
                  <div className="space-y-2">
                    {userAMAs.map((ama) => (
                      <div
                        key={ama.id.toString()}
                        className="p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => {
                              navigate(`/ama/${ama.id.toString()}`);
                              setOpen(false);
                            }}
                            className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                          >
                            <p className="text-sm font-medium truncate">{ama.headingURI}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {Number(ama.messageCount)} messages
                            </p>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 text-primary"
                            aria-label="Copy AMA link"
                            title="Copy AMA link"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyAMALink(ama.id.toString());
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Story History */}
            <AccordionItem value="story-history">
              <AccordionTrigger className="text-sm font-semibold">
                Story History
              </AccordionTrigger>
              <AccordionContent>
                {!subAccountAddress ? (
                  <p className="text-xs text-muted-foreground">Connect wallet to view your stories</p>
                ) : userStories.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No stories posted yet</p>
                ) : (
                  <div className="space-y-2">
                    {userStories.map((story) => (
                      <div
                        key={story.id.toString()}
                        className="p-3 rounded-lg border border-border"
                      >
                        <p className="text-sm line-clamp-2">{story.contentURI}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>❤️ {Number(story.loveCount)}</span>
                          <span>
                            {new Date(Number(story.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
