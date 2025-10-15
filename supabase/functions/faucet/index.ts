import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const BALANCE_THRESHOLD = 100000; // 0.1 USDC (6 decimals)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Ethereum address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Faucet request for address: ${address}`);

    // 1. Check current USDC balance
    const balanceData = `0x70a08231000000000000000000000000${address.substring(2)}`;
    const balanceResponse = await fetch(BASE_SEPOLIA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: USDC_CONTRACT_ADDRESS,
          data: balanceData,
        }, 'latest'],
        id: 1,
      }),
    });

    const balanceResult = await balanceResponse.json();
    const balance = parseInt(balanceResult.result || '0x0', 16);

    console.log(`Current USDC balance: ${balance / 1e6} USDC`);

    if (balance > BALANCE_THRESHOLD) {
      return new Response(
        JSON.stringify({ 
          error: 'Sufficient balance', 
          message: `Your balance is ${(balance / 1e6).toFixed(2)} USDC. Funding not required.`,
          currentBalance: (balance / 1e6).toFixed(2)
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Call CDP Faucet API
    const CDP_API_KEY_ID = Deno.env.get('CDP_API_KEY_ID');
    const CDP_API_KEY_SECRET = Deno.env.get('CDP_API_KEY_SECRET');

    if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET) {
      console.error('CDP credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', message: 'CDP credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling CDP Faucet API...');
    
    const faucetResponse = await fetch('https://api.cdp.coinbase.com/platform/v1/faucet/dispense', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CDP_API_KEY_ID}:${CDP_API_KEY_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: address,
        asset_id: 'usdc',
        network_id: 'base-sepolia',
      }),
    });

    if (!faucetResponse.ok) {
      const errorText = await faucetResponse.text();
      console.error('CDP Faucet API error:', faucetResponse.status, errorText);
      
      if (faucetResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit reached', 
            message: 'You have reached the faucet rate limit. Please try again in 24 hours.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'Faucet API error', 
          message: 'Failed to dispense USDC from faucet',
          details: errorText 
        }),
        { status: faucetResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const faucetResult = await faucetResponse.json();
    console.log('Faucet dispensed successfully:', faucetResult);

    const txHash = faucetResult.transaction_hash || faucetResult.tx_hash;
    
    return new Response(
      JSON.stringify({
        success: true,
        transactionHash: txHash,
        explorerUrl: txHash ? `https://sepolia.basescan.org/tx/${txHash}` : null,
        message: 'USDC sent successfully to your wallet',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Faucet error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
