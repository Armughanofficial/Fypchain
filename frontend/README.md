# FypChain — Decentralized Academic IP Registry & Peer-to-Peer Mentorship dApp

> **Live Application:** [https://fypchain.vercel.app](https://fypchain.vercel.app)  
> **Network:** Ethereum Sepolia Testnet (`Chain ID: 11155111`)  
> **Smart Contracts:** `ThesisCredits` (ERC-20) & `ThesisPlatform` (Registry, Licensing, Mentorship & Soulbound ERC-721)

---

## Overview

University Final Year Projects (FYPs) and undergraduate research typically remain trapped in local folders or static PDFs—leaving student builders without verifiable proof of authorship, an ethical mechanism to license reusable codebases, or structured access to senior peers who have solved similar architectural problems.

**FypChain** transforms academic research into verifiable, on-chain intellectual property through a hybrid Web3 + Web2 architecture:

- **Immutable Proof of Authorship (Soulbound ERC-721):** Verified student research mints a non-transferable Soulbound certificate permanently bound to the creator's wallet.
- **Native Academic Economy (`TCR` — Thesis Credits ERC-20):** A fixed-supply utility token powering repository licensing and 1-on-1 senior mentorship bookings directly on-chain.
- **Hybrid Off-Chain Indexing (Supabase PostgreSQL):** Abstracts, tech stacks, GitHub links, and documentation are indexed in PostgreSQL for fast search and category filtering, while ownership, admin verification, token balances, and Soulbound NFTs are enforced by Solidity smart contracts.

---

## Deployed Smart Contracts (Ethereum Sepolia)

| Contract | Standard | Sepolia Address |
| :--- | :--- | :--- |
| **`ThesisCredits` (`TCR`)** | ERC-20 + Onboarding Faucet | [`0xE9462Dd6A40ca6bA36488896332DF2C96934E5b5`](https://sepolia.etherscan.io/address/0xE9462Dd6A40ca6bA36488896332DF2C96934E5b5) |
| **`ThesisPlatform`** | Registry, Marketplace, Mentorship & Soulbound ERC-721 | [`0x7773a8a25C25b62f2C5Bf0d853C9C5D637480A3D`](https://sepolia.etherscan.io/address/0x7773a8a25C25b62f2C5Bf0d853C9C5D637480A3D) |
| **Platform Admin** | `Ownable` Verifier Role | `0x845EC49536554C99F904BeaFA8Ca2523D9f273Fd` |

---

## Architecture & Smart Contract Design

### 1. `ThesisCredits.sol` (ERC-20 Utility Token)
- **Token Metadata:** `Thesis Credits` (`TCR`), `18` decimals, fixed `1,000,000 TCR` supply minted at deployment to fund student onboarding.
- **`claimFaucet()`:** Grants each wallet a one-time starting balance of `500 TCR` (`hasClaimedFaucet` mapping prevents duplicate claims) so new users can immediately test repository licensing and mentorship bookings.
- **`approve(address spender, uint256 amount)`:** Authorizes `ThesisPlatform` to settle peer-to-peer licensing and mentorship transfers atomically.

### 2. `ThesisPlatform.sol` (IP Registry, Marketplace, Mentorship & Soulbound ERC-721)
- **Soulbound Enforcement:** Overrides OpenZeppelin v5's `_update` hook so minted certificates can only be transferred from `address(0)` (minting) and revert on any subsequent transfer attempt (`"Soulbound: certificate cannot be transferred"`).
- **Research Lifecycle:**
  - `registerProject(uint256 _supabaseId, string memory _metadataURI, uint256 _priceTcr)` — Logs a student's research submission on-chain linked to its off-chain metadata record.
  - `approveAndMint(uint256 _projectId)` *(Admin Only)* — Verifies the submission and mints a non-transferable Soulbound ERC-721 certificate with on-chain Base64 JSON metadata and category-specific artwork directly to the creator's wallet.
  - `rejectProject(uint256 _projectId)` *(Admin Only)* — Marks invalid submissions as rejected on-chain.
- **Peer-to-Peer Licensing & Mentorship:**
  - `licenseProject(uint256 _projectId)` — Transfers `priceTcr` directly from buyer to creator and permanently records licensing rights (`hasLicensed[projectId][buyer]`) to unlock the private GitHub repository.
  - `registerMentor(uint256 _supabaseId, uint256 _sessionPriceTcr)` & `verifyMentor(uint256 _mentorId)` *(Admin Only)* — Onboards and verifies senior student mentors.
  - `bookMentorship(uint256 _mentorId)` — Settles 1-on-1 mentorship session fees in `TCR` directly to the verified mentor.

---

## Key Features

- **Seamless MetaMask & Sepolia Integration:** Automatic Sepolia network detection/switching, live `TCR` navbar balance, and one-click **`+ Add TCR to MetaMask`** (`wallet_watchAsset`) with custom token artwork.
- **Interactive Research Registry:** Multi-field submission wizard with real-time completion progress and a live generative SVG cover preview.
- **Curated Marketplace (`Explore`):** Searchable and filterable across 7 academic domains (`Tech & Software`, `Neuroscience`, `Climate`, `Identity`, `Agriculture`, `Privacy`, `FinTech`) with a full project detail modal and two-step ERC-20 `approve()` + `licenseProject()` checkout.
- **Creator Workspace (`Dashboard`):** Track registered submissions, inspect and edit off-chain project abstracts/links, view minted Soulbound certificates, and access unlocked repositories.
- **Admin Governance Panel:** Restricted to the on-chain contract owner (`0x845EC...73Fd`) to approve/mint Soulbound certificates, reject invalid entries, and verify student mentors.
- **Editorial UI & Motion System:** Light/dark theme toggle, bespoke geometric SVG project covers, interactive 3D-revolving `TCR` token graphic, and scroll-scrubbed GSAP animations.

---

## Tech Stack

- **Smart Contracts:** Solidity `^0.8.26`, OpenZeppelin Contracts v5 (`ERC20`, `ERC721URIStorage`, `Ownable`), Hardhat, Remix IDE
- **Frontend:** React 19, Vite, Tailwind CSS, `ethers.js` v6, GSAP (`ScrollTrigger`)
- **Off-Chain Database:** Supabase (PostgreSQL)
- **Infrastructure:** Ethereum Sepolia Testnet, Vercel, GitHub

---

## Project Structure

```text
Fypchain/
├── contracts/
│   ├── contracts/
│   │   ├── ThesisCredits.sol       # ERC-20 TCR utility token + 500 TCR faucet
│   │   └── ThesisPlatform.sol      # IP registry, licensing, mentorship & Soulbound ERC-721
│   ├── scripts/
│   │   └── deploy.js               # Automated deployment & ABI export script
│   ├── test/
│   │   └── ThesisChain.test.js     # Hardhat unit & integration tests
│   ├── deployedContracts.json      # Sepolia contract addresses & ABIs
│   ├── hardhat.config.js           # Hardhat configuration
│   └── .env.example                # Contract environment variable template
├── frontend/
│   ├── public/                     # Soulbound NFT category PNGs & TCR token icon
│   ├── src/
│   │   ├── components/             # Navbar & bespoke SVG/Certificate artwork
│   │   ├── context/Web3Context.jsx # MetaMask provider, Sepolia guard & contract instances
│   │   ├── lib/supabase.js         # Supabase PostgreSQL client
│   │   ├── pages/                  # Landing, Explore, Mentorship, Registry, Dashboard, Admin
│   │   ├── deployedContracts.json  # Synced Sepolia ABIs & addresses
│   │   └── index.css               # Design system tokens & responsive layout
│   ├── index.html
│   └── .env.example
└── README.md

**Local Development:**

*Clone the repository:*

git clone [https://github.com/Armughanofficial/Fypchain.git](https://github.com/Armughanofficial/Fypchain.git)
cd Fypchain

*Install dependencies:*
cd contracts && npm install
cd ../frontend && npm install

*Configure environment variables:*

Copy frontend/.env.example to frontend/.env and add your Supabase credentials:

VITE_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

*Start the development server:*

npm run dev