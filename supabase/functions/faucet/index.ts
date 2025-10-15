// supabase/functions/faucet/index.ts
// FINAL, CORRECT IMPLEMENTATION USING THE OFFICIAL SDK

import { CdpApiClient, CdpApiError } from 'npm:@coinbase/cdp-sdk@^1.38.3';
import { createPublicClient, http, parseUnits } from 'npm:viem@^2.0.0';
import { baseSepolia } from 'npm:viem/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // This will be locked down in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Official SDK and VIEM Client Initialization ---
const cdpApiClient = new CdpApiClient({
  apiKeyId: Deno.env.get('CDP_API_KEY_ID'),
  apiKeySecret: Deno.env.get('CDP_API_KEY_SECRET'),
  walletSecret: Deno.env.get('CDP_WALLET_SECRET'), // This is required for the SDK
});

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_ABI = [{"name":"balanceOf","type":"function","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"}];
const BALANCE_THRESHOLD = parseUnits('0.1', 6);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('A valid Ethereum address is required.');
    }

    // 1. Check user's USDC balance
    const balance = await publicClient.readContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    if (balance > BALANCE_THRESHOLD) {
      return new Response(JSON.stringify({ error: 'Sufficient balance. Funding not required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // 2. Call the Faucet API using the robust, official SDK method
    const result = await cdpApiClient.faucet.dispense(address, 'USDC_BASE_SEPOLIA');

    return new Response(JSON.stringify({
        success: true,
        transactionHash: result.transactionHash,
        explorerUrl: `https://sepolia.basescan.org/tx/${result.transactionHash}`,
        message: '1 USDC sent successfully to your wallet.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Faucet Function Error:', error);
    const errorMessage = error instanceof CdpApiError ? error.message : 'An unexpected error occurred.';
    const errorStatus = error instanceof CdpApiError ? error.statusCode : 500;
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: errorStatus || 500,
    });
  }
});
