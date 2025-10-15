// supabase/functions/faucet/index.ts
// FINAL, CORRECT IMPLEMENTATION USING THE OFFICIAL SDK

import { CdpApiClient, CdpApiError } from 'npm:@coinbase/cdp-sdk@^1.38.3';
import { createPublicClient, http, parseUnits } from 'npm:viem@^2.0.0';
import { baseSepolia } from 'npm:viem/chains';

// --- CORS Configuration ---
// For production, you should lock this down to your specific frontend URL
// Example: const ALLOWED_ORIGIN = 'https://www.your-basestory-app.com';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Official SDK and VIEM Client Initialization ---
// This code is safer because the SDK handles the complex authentication and
// key formatting, preventing the "PKCS#8" error you encountered.
const cdpApiClient = new CdpApiClient({
  apiKeyId: Deno.env.get('CDP_API_KEY_ID'),
  apiKeySecret: Deno.env.get('CDP_API_KEY_SECRET'),
  walletSecret: Deno.env.get('CDP_WALLET_SECRET'), // This is required by the SDK
});

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_ABI = [{"name":"balanceOf","type":"function","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"}];
const BALANCE_THRESHOLD = parseUnits('0.1', 6); // 0.1 USDC

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure credentials are present on the server
    if (!Deno.env.get('CDP_API_KEY_ID') || !Deno.env.get('CDP_API_KEY_SECRET') || !Deno.env.get('CDP_WALLET_SECRET')) {
      console.error("Server configuration error: CDP environment variables are missing.");
      throw new Error("Server configuration error.");
    }

    const { address } = await req.json();
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return new Response(JSON.stringify({ error: 'A valid Ethereum address is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Check user's current USDC balance before calling the faucet
    const balance = await publicClient.readContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    if (balance > BALANCE_THRESHOLD) {
      return new Response(JSON.stringify({ error: 'Sufficient balance. Funding not required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Use 403 Forbidden for this specific case
      });
    }

    // 2. Call the Faucet API using the robust, official SDK method
    const result = await cdpApiClient.faucet.dispense(address, 'USDC_BASE_SEPOLIA');

    // 3. Return a success response
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
    // --- Centralized Error Handling ---
    console.error('Faucet Function Error:', error);
    
    const isCdpError = error instanceof CdpApiError;
    const errorMessage = isCdpError ? error.message : 'An unexpected error occurred.';
    const errorStatus = isCdpError ? error.statusCode : 500;
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: errorStatus || 500,
    });
  }
});
