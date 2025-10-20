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
import { X, Share2, RefreshCw } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { toast } from 'sonner';
import { useWallet } from './WalletProvider';
import { getPublicClient } from '../viemClient';
import { CONTRACT_ABI, AMA_CONTRACT_ABI } from '../config';
import { getContractAddress } from '@/networkConfig';
import { getAllAMAs } from '@/lib/amaHelpers';

export const SessionsDrawer = () => {
  const [open, setOpen] = useState(false);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [userAMAs, setUserAMAs] = useState<any[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>('ama-sessions');
  const { subAccountAddress, universalAddress, currentNetwork } = useWallet();
  const navigate = useNavigate();

  console.log('[SessionsDrawer] render - initial', { subAccountAddress, universalAddress, currentNetwork });

  // Debug logging for state changes
  useEffect(() => {
    console.log('[SessionsDrawer] State change:', {
      open,
      activePanel,
      subAccountAddress,
      universalAddress,
      currentNetwork,
    });
  }, [open, activePanel, subAccountAddress, universalAddress, currentNetwork]);

  const CONTRACT_ADDRESS = getContractAddress(currentNetwork, 'baseStory');
  const AMA_CONTRACT_ADDRESS = getContractAddress(currentNetwork, 'baseAMA');

  useEffect(() => {
    console.log('[SessionsDrawer] useEffect triggered:', {
      hasSubAccount: !!subAccountAddress,
      hasUniversal: !!universalAddress,
      activePanel,
      willFetch: (!!subAccountAddress || !!universalAddress) && !!activePanel,
    });
    
    if ((!subAccountAddress && !universalAddress) || !activePanel) {
      console.log('[SessionsDrawer] Skipping fetch - missing addresses or no active panel');
      return;
    }
    
    if (activePanel === 'ama-sessions') {
      console.log('[SessionsDrawer] Triggering fetchUserAMAs from main useEffect');
      fetchUserAMAs();
    }
    if (activePanel === 'story-history') {
      console.log('[SessionsDrawer] Triggering fetchUserStories');
      fetchUserStories();
    }
  }, [subAccountAddress, universalAddress, activePanel, currentNetwork]);

  // Refetch when drawer opens while panel is active
  useEffect(() => {
    if (open && activePanel === 'ama-sessions' && (subAccountAddress || universalAddress)) {
      fetchUserAMAs();
    }
  }, [open, activePanel, subAccountAddress, universalAddress, currentNetwork]);

  const fetchUserStories = async () => {
    if (!subAccountAddress) return;
    try {
      const client = getPublicClient(currentNetwork);
      const allStories = await client.readContract({
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
    console.log('[SessionsDrawer] fetchUserAMAs called');
    if (!subAccountAddress && !universalAddress) {
      console.log('[SessionsDrawer] No addresses available, aborting fetch');
      return;
    }
    try {
      console.log('[SessionsDrawer] Fetching AMAs for network:', currentNetwork, 'subAccount:', subAccountAddress, 'universal:', universalAddress);
      const allAMAs = await getAllAMAs(currentNetwork);
      console.log('[SessionsDrawer] All AMAs fetched:', allAMAs.length, 'total');
      
      // Log each AMA creator for debugging
      allAMAs.forEach((ama, idx) => {
        console.log(`[SessionsDrawer] AMA ${idx}: ID=${ama.id?.toString()}, creator=${ama.creator}`);
      });
      
      const myAMAs = allAMAs.filter((ama) => {
        const creatorLower = ama.creator.toLowerCase();
        const matchesSub = subAccountAddress && creatorLower === subAccountAddress.toLowerCase();
        const matchesUniversal = universalAddress && creatorLower === universalAddress.toLowerCase();
        
        console.log(`[SessionsDrawer] Checking AMA ${ama.id?.toString()}: creator=${creatorLower}, matchesSub=${matchesSub}, matchesUniversal=${matchesUniversal}`);
        
        return matchesSub || matchesUniversal;
      });
      console.log('[SessionsDrawer] My AMAs found:', myAMAs.length);
      setUserAMAs(myAMAs);
    } catch (error) {
      console.error('[SessionsDrawer] Failed to fetch user AMAs:', error);
      toast.error('Failed to load AMAs');
    }
  };

  const copyAMALink = (amaId: string) => {
    const link = `${window.location.origin}/ama/${amaId}`;
    navigator.clipboard.writeText(link);
    toast.success('AMA link copied to clipboard!');
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        console.log('[SessionsDrawer] onOpenChange:', v);
        setOpen(v);
      }}
    >
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs sm:text-sm rounded-sm px-2 sm:px-3"
          onClick={() => console.log('[SessionsDrawer] Trigger clicked')}
          data-testid="sessions-trigger"
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
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="ama-sessions"
            onValueChange={(val) => {
              console.log('[SessionsDrawer] Accordion onValueChange:', val);
              setActivePanel((val as string) || null);
            }}
          >
            {/* AMA Sessions */}
            <AccordionItem value="ama-sessions">
              <AccordionTrigger className="text-sm font-semibold">
                AMA sessions
              </AccordionTrigger>
              <AccordionContent>
                <div className="mb-3 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('[SessionsDrawer] Manual refresh button clicked');
                      fetchUserAMAs();
                    }}
                    className="h-7 text-xs gap-1"
                    data-testid="ama-refresh-btn"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Force Refresh
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {subAccountAddress ? `Sub: ${subAccountAddress.slice(0, 6)}...${subAccountAddress.slice(-4)}` : (universalAddress ? `Uni: ${universalAddress.slice(0,6)}...${universalAddress.slice(-4)}` : 'No address')}
                  </p>
                </div>
                {!subAccountAddress && !universalAddress ? (
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
