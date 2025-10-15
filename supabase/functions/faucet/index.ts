import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v5.9.6/index.ts";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const BALANCE_THRESHOLD = 100000; // 0.1 USDC (6 decimals)

async function generateCDPJwt(apiKeyId: string, apiKeySecret: string, requestMethod: string, requestPath: string): Promise<string> {
  try {
    // Format the private key properly
    let pemKey = apiKeySecret.trim();
    
    // Replace escaped newlines with actual newlines
    if (pemKey.includes('\\n')) {
      pemKey = pemKey.replace(/\\n/g, '\n');
    }
    
    // Ensure proper PEM formatting
    if (!pemKey.includes('-----BEGIN')) {
      pemKey = `-----BEGIN EC PRIVATE KEY-----\n${pemKey}\n-----END EC PRIVATE KEY-----`;
    }

    console.log('Importing private key...');
    
    // Import the EC private key for ES256
    const privateKey = await importPKCS8(pemKey, 'ES256');

    console.log('Creating JWT...');
    
    // Create JWT following CDP spec
    const jwt = await new SignJWT({
      uri: `${requestMethod} ${requestPath}`
    })
      .setProtectedHeader({ 
        alg: 'ES256', 
        kid: apiKeyId,
        nonce: crypto.randomUUID()
      })
      .setSubject(apiKeyId)
      .setIssuer('cdp')
      .setIssuedAt()
      .setNotBefore(Math.floor(Date.now() / 1000))
      .setExpirationTime(Math.floor(Date.now() / 1000) + 120) // 2 minutes
      .sign(privateKey);

    return jwt;
  } catch (error) {
    console.error('JWT generation error:', error);
    throw new Error(`Failed to generate JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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

    // 2. Get CDP credentials
    const CDP_API_KEY_ID = Deno.env.get('CDP_API_KEY_ID');
    const CDP_API_KEY_SECRET = Deno.env.get('CDP_API_KEY_SECRET');

    if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET) {
      console.error('CDP credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', message: 'CDP credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating CDP JWT token...');
    
    // 3. Generate JWT for authentication
    const requestPath = `/v1/networks/base-sepolia/addresses/${address}/faucet`;
    const jwt = await generateCDPJwt(CDP_API_KEY_ID, CDP_API_KEY_SECRET, 'POST', requestPath);

    console.log('Calling CDP Faucet API...');
    
    // 4. Call CDP Faucet API with JWT
    const faucetResponse = await fetch(`https://api.cdp.coinbase.com/platform${requestPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
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

    const txHash = faucetResult.transaction_hash;
    
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
