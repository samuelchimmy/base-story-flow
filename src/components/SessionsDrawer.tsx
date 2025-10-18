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
import { X } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { publicClient } from '../viemClient';
import { CONTRACT_ADDRESS, CONTRACT_ABI, AMA_CONTRACT_ADDRESS, AMA_CONTRACT_ABI } from '../config';
import { getAllAMAs } from '@/lib/amaHelpers';

export const SessionsDrawer = () => {
  const [open, setOpen] = useState(false);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [userAMAs, setUserAMAs] = useState<any[]>([]);
  const { subAccountAddress } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && subAccountAddress) {
      fetchUserData();
    }
  }, [open, subAccountAddress]);

  const fetchUserData = async () => {
    if (!subAccountAddress) return;

    try {
      // Fetch user's stories
      const allStories = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getAllStories',
      });

      const myStories = allStories.filter(
        (story: any) => story.author.toLowerCase() === subAccountAddress.toLowerCase() && !story.deleted
      );

      setUserStories(myStories);

      // Fetch user's AMAs
      const allAMAs = await getAllAMAs();
      const myAMAs = allAMAs.filter(
        (ama) => ama.creator.toLowerCase() === subAccountAddress.toLowerCase()
      );

      setUserAMAs(myAMAs);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
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

        <div className="overflow-y-auto px-4 pb-4 space-y-6">
          {/* AMA Sections */}
          <div>
            <h3 className="text-sm font-semibold mb-3">AMA sessions</h3>
            {!subAccountAddress ? (
              <p className="text-xs text-muted-foreground">Connect wallet to view your AMAs</p>
            ) : userAMAs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No AMAs created yet</p>
            ) : (
              <div className="space-y-2">
                {userAMAs.map((ama) => (
                  <button
                    key={ama.id.toString()}
                    onClick={() => {
                      navigate(`/ama/${ama.id.toString()}`);
                      setOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{ama.headingURI}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Number(ama.messageCount)} messages
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Story History */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Story History</h3>
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
