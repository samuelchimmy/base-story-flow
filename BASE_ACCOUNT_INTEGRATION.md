# BaseStory - Base Account SDK Integration

## 🎯 Bounty Requirement: No Wallet Pop-ups

This application demonstrates the core requirement of **Base Builder Quest 11** by eliminating repeated wallet signing prompts through the implementation of **Sub Accounts with Auto Spend Permissions** using the Base Account SDK.

## 🔑 Key Implementation

### 1. SDK Initialization with Sub Accounts

Located in `src/components/WalletProvider.tsx`:

```typescript
const sdkInstance = createBaseAccountSDK({
  appName: 'BaseStory',
  appLogoUrl: window.location.origin + '/favicon.ico',
  appChainIds: [base.id],
  subAccounts: {
    creation: 'on-connect',    // Auto-create sub account when user connects
    defaultAccount: 'sub',      // Use sub account by default for all transactions
  },
});
```

**What this does:**
- Automatically creates an app-specific Sub Account when the user first connects
- All transactions are sent from the Sub Account by default
- Enables Auto Spend Permissions for frictionless transactions

### 2. Frictionless Transaction Flow

The app demonstrates the "no wallet pop-up" experience through three on-chain actions:

#### First Transaction (Initial Approval)
When a user performs their first on-chain action (loving a story or sending a tip), they see a **single approval popup** that:
1. Approves the current transaction
2. Grants ongoing spend permissions for future transactions

#### Subsequent Transactions (Zero Pop-ups)
All future on-chain actions execute **without any wallet prompts**:
- ❤️ Loving stories
- 💙 Tipping authors
- 📝 Posting stories

### 3. Using wallet_sendCalls (EIP-5792)

All on-chain interactions use the `wallet_sendCalls` method:

```typescript
const callsId = await provider.request({
  method: 'wallet_sendCalls',
  params: [{
    version: '2.0',
    atomicRequired: true,
    chainId: `0x${base.id.toString(16)}`,
    from: subAccountAddress,  // Send from Sub Account
    calls: [{
      to: recipientAddress,
      data: '0x...',
      value: '0x...',
    }],
  }],
});
```

## 📱 User Experience Flow

### 1. Connect Wallet
- User clicks "Connect Wallet"
- Base Account connection popup appears
- Sub Account is automatically created (if doesn't exist)
- User is assigned an anonymous username

### 2. First Interaction (One-time Approval)
- User clicks "Love" or "Tip" for the first time
- **Single popup** appears requesting:
  - Approval for the current transaction
  - Grant of ongoing spend permissions
- User approves once

### 3. Seamless Interactions
- All subsequent loves, tips, and posts execute immediately
- **Zero wallet pop-ups**
- Smooth, web2-like experience

## 🏗️ Architecture

### WalletProvider (`src/components/WalletProvider.tsx`)
- Initializes Base Account SDK
- Manages Sub Account creation and state
- Provides `sendCalls` function for frictionless transactions

### StoryFeed (`src/components/StoryFeed.tsx`)
- Implements love and tip functionality
- Uses `sendCalls` for on-chain interactions
- Demonstrates Auto Spend Permissions in action

### StoryCard (`src/components/StoryCard.tsx`)
- UI for individual stories
- Interactive buttons for love, tip, and share
- Optimistic updates for better UX

## 🎨 Features

- **Anonymous Identity**: Auto-generated usernames for privacy
- **Story Feed**: Latest and Most Loved sorting
- **On-chain Interactions**:
  - ❤️ Love stories (on-chain transaction)
  - 💙 Tip authors (payable transaction)
  - 🔗 Share to social platforms
- **Mobile-First Design**: Optimized for mobile with touch-friendly UI
- **Clean UI**: White background, blue accents (#0052FF), rounded corners

## 🚀 Technical Stack

- **React** with Vite
- **Base Account SDK** (`@base-org/account`)
- **Viem** for Ethereum interactions
- **TailwindCSS** for styling
- **Shadcn UI** for components
- **TypeScript** for type safety

## 📝 Key Files

1. `src/components/WalletProvider.tsx` - Base Account SDK integration
2. `src/components/StoryFeed.tsx` - On-chain transaction implementations
3. `src/components/StoryCard.tsx` - Interactive story cards
4. `src/components/Header.tsx` - Wallet connection UI
5. `src/components/Hero.tsx` - App branding

## 🎯 Bounty Compliance

✅ **Sub Accounts**: Auto-created on wallet connection  
✅ **Auto Spend Permissions**: Enabled by default  
✅ **No Repeated Pop-ups**: Only one approval needed for ongoing transactions  
✅ **EIP-5792**: Uses `wallet_sendCalls` for transaction batching  
✅ **User Control**: Users can manage Sub Accounts at account.base.app  

## 🔐 Security & User Control

- Sub Accounts are fully controlled by the user's main Base Account
- Users can view and manage all Sub Accounts at [account.base.app](https://account.base.app)
- Spend permissions can be revoked at any time
- All transactions are recorded on-chain

## 💡 Future Enhancements

- Smart contract deployment for storing stories on-chain
- Gas sponsorship via Paymaster for fully gasless experience
- NFT minting for popular stories
- Integration with Farcaster Frames
- Real-time story feed updates

---

**Built with 💙 by Jadeofwallstreet**
