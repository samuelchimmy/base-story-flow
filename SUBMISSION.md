# Base Builder Quest 11 - Submission

## 📋 Submission Information

**App Name**: BaseStory  
**Developer**: Jadeofwallstreet  
**Portfolio**: https://www.0xnotes.lol/  
**Submission Date**: October 15, 2025

---

## 🎯 Bounty Requirement: Build an on-chain app with no wallet pop-ups

**Requirement**: Use the Base Account SDK to integrate Sub Accounts with Auto Spend Permissions into a new or existing app.

**Solution**: BaseStory implements Sub Accounts with Auto Spend Permissions to create a completely frictionless on-chain story platform where users can:
- Love stories (on-chain transaction)
- Tip authors (payable transaction)
- Post stories (future feature)

After the initial approval, **all subsequent transactions execute without any wallet pop-ups**.

---

## 🚀 Live Demo

**App URL**: https://lovable.dev/projects/2fd8ecf1-3fb4-4d81-9410-6198e8b18815

**Code Repository**: Available through the Lovable project link

---

## 📹 Video Demo / Screenshots

### User Flow:

1. **Connect Wallet**
   - User clicks "Connect Wallet"
   - Base Account connection popup appears
   - Sub Account is automatically created for the app
   - User is assigned an anonymous username

2. **First Transaction (One Approval)**
   - User clicks "Love" or "Tip" button
   - **Single approval popup** appears requesting:
     - Permission for the current transaction
     - Auto Spend Permission for future transactions
   - User approves once

3. **Frictionless Experience**
   - User clicks "Love" on another story → Executes instantly, no popup
   - User sends a tip → Executes instantly, no popup
   - User loves more stories → All execute instantly, no popups
   - **Zero friction, web2-like experience**

---

## 🔧 Technical Implementation

### Base Account SDK Configuration

```typescript
const sdkInstance = createBaseAccountSDK({
  appName: 'BaseStory',
  appLogoUrl: window.location.origin + '/favicon.ico',
  appChainIds: [base.id],
  subAccounts: {
    creation: 'on-connect',    // ✅ Auto-create on connect
    defaultAccount: 'sub',      // ✅ Use sub account by default
  },
});
```

### Transaction Execution (wallet_sendCalls)

```typescript
const callsId = await provider.request({
  method: 'wallet_sendCalls',
  params: [{
    version: '2.0',
    atomicRequired: true,
    chainId: `0x${base.id.toString(16)}`,
    from: subAccountAddress,  // Sent from Sub Account
    calls: [{
      to: recipientAddress,
      value: '0x38D7EA4C68000', // 0.001 ETH tip
    }],
  }],
});
```

### Key Features

✅ **Sub Account Auto-Creation**: Created on wallet connection  
✅ **Auto Spend Permissions**: Enabled by default  
✅ **EIP-5792 wallet_sendCalls**: Used for all transactions  
✅ **Frictionless UX**: No repeated popups after initial approval  
✅ **Mobile-First Design**: Optimized for mobile devices  
✅ **Clean UI**: White background, Base blue (#0052FF) accents  

---

## 📂 Code Structure

```
src/
├── components/
│   ├── WalletProvider.tsx    # 🔑 Base Account SDK integration
│   ├── Header.tsx             # Wallet connection UI
│   ├── Hero.tsx               # App branding
│   ├── StoryFeed.tsx          # 💙 On-chain transactions (love, tip)
│   ├── StoryCard.tsx          # Story UI with interactions
│   └── Footer.tsx             # Attribution
├── pages/
│   └── Index.tsx              # Main app page
└── lib/
    └── baseAccount.ts         # SDK utilities
```

**Most Important Files**:
- `src/components/WalletProvider.tsx` - Complete Base Account SDK implementation
- `src/components/StoryFeed.tsx` - Demonstrates frictionless transactions

---

## 🎨 Design & UX

**Visual Design**:
- Clean, minimal Twitter/Farcaster-inspired feed
- White background with Base blue (#0052FF) primary color
- Rounded corners throughout
- Bangers font for branding
- Mobile-first responsive design

**User Experience**:
- Anonymous identity with auto-generated usernames
- Instagram-like love button that turns blue when clicked
- One-click tipping (0.001 ETH)
- Social sharing to Twitter, Farcaster, etc.
- Story sorting by Latest or Most Loved

---

## 📖 Documentation

- **README.md**: Project overview and setup
- **BASE_ACCOUNT_INTEGRATION.md**: Detailed technical documentation
- **SUBMISSION.md**: This file - submission details

---

## 🏆 Why This App Wins

1. **Perfect Bounty Compliance**: Implements Sub Accounts with Auto Spend Permissions exactly as required
2. **Real Use Case**: Actual on-chain anonymous story platform, not just a demo
3. **Exceptional UX**: After one approval, completely frictionless transactions
4. **Clean Code**: Well-structured, documented, TypeScript codebase
5. **Beautiful Design**: Mobile-first, polished UI that users will love
6. **Practical Application**: Solves real problem of wallet pop-up fatigue

---

## 🔗 Links

- **Live App**: https://lovable.dev/projects/2fd8ecf1-3fb4-4d81-9410-6198e8b18815
- **Developer Portfolio**: https://www.0xnotes.lol/
- **Base Account SDK Docs**: https://docs.base.org/base-account
- **Base**: https://base.org

---

## 📝 Additional Notes

This app demonstrates that Sub Accounts with Auto Spend Permissions can create a truly seamless on-chain experience. Users coming from web2 expect instant interactions, and this implementation delivers exactly that after a single initial approval.

The anonymous story platform use case is perfect for showcasing this technology because:
- Users want to love and tip frequently (high transaction volume)
- Each interaction should be instant and seamless
- No one wants to sign 50 popups while browsing stories
- The frictionless UX encourages more on-chain engagement

**BaseStory proves that Base Account SDK makes on-chain apps feel as smooth as web2.**

---

**Built with 💙 by Jadeofwallstreet**
