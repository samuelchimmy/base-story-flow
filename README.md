# BaseStory - Anonymous On-Chain Stories

> **Base Builder Quest 11 Submission:** An on-chain story platform built with a frictionless, "no wallet pop-up" user experience powered by the Base Account SDK.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Live Demo

**[https://base-story-flow.vercel.app/](https://base-story-flow.vercel.app/)**

---

## What is BaseStory?

BaseStory is a simple, anonymous, on-chain story platform built on the Base network. It allows users to share stories, thoughts, and "alphas" without revealing their identity. The core of the application is its seamless user experience, where all on-chain interactions—loving, tipping, and posting happen instantly without the constant interruption of wallet pop-ups.

This is made possible by leveraging the power of the **Base Account SDK**.

## Bounty Compliance: "Build an onchain app with no wallet pop-ups"

This application was built specifically to meet and exceed the requirements of Base Builder Quest 11. Here is how we utilized the required technologies:

#### **Sub Accounts (`Base Account SDK`)**
The app is configured to automatically create a unique, app-specific **Sub Account** for each user the first time they connect their Base Account. This is achieved by setting `creation: 'on-connect'` and `defaultAccount: 'sub'` in the SDK configuration. This app-specific wallet is then used to sign all subsequent transactions, creating a secure, sandboxed environment for user interactions.

#### **Auto Spend Permissions**
To create a truly frictionless experience, the app leverages **Auto Spend Permissions**, which are enabled by default for Sub Accounts. When a user performs their first on-chain action (like loving a story), they are prompted to approve a spending limit. Once granted, all future transactions can be executed by the Sub Account instantly, using funds from the parent Base Account without requiring another pop-up. This is the key to our "no pop-up" design.

---

## Key Features

*   **Frictionless On-Chain Actions**: After a one-time approval, post stories, love content, and tip authors in USDC instantly and without any further wallet pop-ups.
*   **Anonymous Identity**: Usernames are auto-generated for each session to ensure privacy.
*   **On-Chain Data**: All stories, loves, and tip counts are stored and managed by a custom-built Solidity smart contract on the Base Sepolia network.
*   **Real View Counts**: A hybrid architecture uses Supabase to track high-frequency data like view counts off-chain, providing real metrics without excessive gas costs.
*   **Clean & Responsive UI**: A mobile-first design built with TailwindCSS and shadcn-ui, featuring a clean white background and Base-blue accents.

## Tech Stack

*   **Smart Contract**: Solidity
*   **Blockchain**: Base Sepolia
*   **Frontend**: React (Vite) + TypeScript
*   **Wallet Integration**: Base Account SDK (`@base-org/account`)
*   **Blockchain Interaction**: Viem
*   **Styling**: TailwindCSS, shadcn-ui, Lucide Icons
*   **Off-Chain Backend**: Supabase (Edge Functions & Database for view counts)

## Local Development

To run this project locally, you will need Node.js and `pnpm` installed.

1.  ### 🧭 Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/samuelchimmy/base-story-flow.git
Then navigate into the project directory:

bash
Copy code
cd base-story-flow
📦 Install Dependencies
bash
Copy code
pnpm install
⚙️ Set Up Environment Variables
Create a .env file in the project root and add the following (replace the placeholders with your actual keys):

bash
Copy code
# Supabase (for view counts)
VITE_SUPABASE_URL="..."
VITE_SUPABASE_ANON_KEY="..."
VITE_SUPABASE_INCREMENT_VIEW_URL="..."

# Supabase Edge Functions (server-side)
# These are set in the Supabase dashboard, not here
# SUPABASE_SERVICE_ROLE_KEY="..."
    
# Coinbase Faucet API (server-side)
# These are set in the Supabase dashboard, not here
# CDP_API_KEY_ID="..."
# CDP_API_KEY_SECRET="..."
# CDP_WALLET_SECRET="..."
🚀 Run the Development Server
bash
Copy code
pnpm dev


### Credit

This project was built with 💙 by **Jadeofwallstreet**.

*   **Portfolio:** [https://www.0xnotes.lol/](https://www.0xnotes.lol/)
*   **X (Twitter):** [https://x.com/MetisCharter](https://x.com/MetisCharter)
