# BaseStory - Anonymous On-Chain Stories on Base

> **Base Builder Quest 11 Submission** - An on-chain app with no wallet pop-ups using Base Account SDK

## 🎯 Bounty Compliance

This app implements **Sub Accounts with Auto Spend Permissions** using the Base Account SDK to create a frictionless, "no wallet pop-up" user experience:

✅ **Sub Accounts**: Automatically created on wallet connection using `creation: 'on-connect'`  
✅ **Auto Spend Permissions**: Enabled by default for seamless repeat transactions  
✅ **No Pop-ups**: After initial approval, all transactions execute without prompts  
✅ **wallet_sendCalls**: Uses EIP-5792 for transaction batching  
✅ **User Experience**: Love, tip, and post stories with zero friction  

See [BASE_ACCOUNT_INTEGRATION.md](./BASE_ACCOUNT_INTEGRATION.md) for detailed implementation.

## 🚀 Live Demo

**URL**: https://lovable.dev/projects/2fd8ecf1-3fb4-4d81-9410-6198e8b18815

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2fd8ecf1-3fb4-4d81-9410-6198e8b18815) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 💡 What is BaseStory?

BaseStory is an anonymous on-chain story platform where users can:
- 📝 Share stories and alphas anonymously
- ❤️ Love stories (on-chain transaction)
- 💙 Tip authors (payable transaction)
- 🔗 Share to social platforms (Twitter, Farcaster, etc.)
- 👁️ View story engagement metrics

All on-chain interactions happen **without repeated wallet pop-ups** thanks to Base Account SDK's Sub Accounts and Auto Spend Permissions.

## 🛠️ Technologies

- **Base Account SDK** (`@base-org/account`) - Sub Accounts & Auto Spend Permissions
- **React** + **Vite** - Frontend framework
- **TypeScript** - Type safety
- **Viem** - Ethereum interactions
- **TailwindCSS** - Styling
- **shadcn-ui** - UI components
- **Lucide Icons** - Icon library

## ✨ Key Features

- **Frictionless Transactions**: Only one approval needed, then all future transactions are seamless
- **Anonymous Posting**: Auto-generated usernames for privacy
- **Story Feed**: Sort by Latest or Most Loved
- **Mobile-First Design**: Optimized for mobile with rounded UI
- **Clean Design**: White background, Base blue (#0052FF) accents

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2fd8ecf1-3fb4-4d81-9410-6198e8b18815) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
