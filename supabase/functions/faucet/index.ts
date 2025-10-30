// supabase/functions/faucet/index.ts
// Implementation using the official Coinbase CDP SDK
// 
// ⚠️ NOTE: This function is for TESTNET ONLY (Base Sepolia)
// The mainnet version of BaseStory uses a different funding mechanism
// This function is preserved for the separate testnet deployment

import { CdpClient } from 'npm:@coinbase/cdp-sdk@^1.38.3';
import { createPublicClient, http, parseUnits } from 'npm:viem@^2.0.0';
import { baseSepolia } from 'npm:viem/chains';

// CORS Configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize CDP Client
const cdp = new CdpClient();

// Initialize Viem client for balance checks
const publicClient = createPublicClient({ 
  chain: baseSepolia, 
  transport: http() 
});

const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_ABI = [{
  name: 'balanceOf',
  type: 'function',
  inputs: [{ name: 'account', type: 'address' }],
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view'
}];
const BALANCE_THRESHOLD = parseUnits('0.1', 6); // 0.1 USDC

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify environment variables are configured
    if (!Deno.env.get('CDP_API_KEY_ID') || !Deno.env.get('CDP_API_KEY_SECRET')) {
      console.error('Server configuration error: CDP credentials not configured');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error',
        message: 'CDP credentials not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const { address } = await req.json();
    
    // Validate Ethereum address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return new Response(JSON.stringify({ 
        error: 'A valid Ethereum address is required.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check user's current USDC balance
    const balance = await publicClient.readContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    }) as bigint;

    console.log(`Address ${address} balance: ${balance.toString()} (threshold: ${BALANCE_THRESHOLD})`);

    if (balance > BALANCE_THRESHOLD) {
      return new Response(JSON.stringify({ 
        error: 'Sufficient balance. Funding not required.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Request USDC from CDP Faucet
    console.log(`Requesting USDC from faucet for address: ${address}`);
    const faucetResponse = await cdp.evm.requestFaucet({
      address: address,
      network: 'base-sepolia',
      token: 'usdc'
    });

    console.log(`Faucet request successful. Transaction: ${faucetResponse.transactionHash}`);

    return new Response(JSON.stringify({
      success: true,
      transactionHash: faucetResponse.transactionHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${faucetResponse.transactionHash}`,
      message: 'USDC sent successfully to your wallet',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Faucet Function Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    let errorStatus = 500;
    
    // Check for rate limit errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      errorStatus = 429;
      return new Response(JSON.stringify({ 
        error: 'Rate limit reached. Please try again in 24 hours.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorStatus,
      });
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: errorStatus,
    });
  }
});
