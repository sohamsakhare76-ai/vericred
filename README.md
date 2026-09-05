# VeriCred

**Instantly verifiable educational credentials on-chain.**

HackBlox 2026 — Web3 Track — Problem Statement: On-Chain Verifiable
Credentials (Soulbound Certificates)

## Problem

Traditional educational credentials are slow to verify, easy to forge, and
scattered across institutions with no common way to check authenticity.

## Solution

VeriCred issues certificates as **soulbound (non-transferable) ERC-721
NFTs**. A whitelisted issuer wallet (a university or course platform) mints
a credential directly to a student's wallet. The certificate's metadata
lives on IPFS; only a lightweight reference is stored on-chain. Anyone —
with or without a wallet — can look up a token ID and see its live,
on-chain status: valid or revoked.

## Features

- Soulbound ERC-721 certificates — transfers, approvals, and operator
  approvals all revert.
- Owner-managed issuer whitelist (`addIssuer` / `removeIssuer`).
- Certificate metadata on IPFS (Pinata), referenced on-chain by URI.
- Public verification page that accepts either a **token ID**
  (`/verify/:tokenId`) or a **wallet address** (`/verify/wallet/:address`,
  listing every certificate issued to that wallet) — neither requires
  connecting a wallet.
- Issuer dashboard for creating certificates end-to-end (IPFS upload → mint).
- Certificate revocation (status flag, not burn/transfer) by the issuing
  issuer or contract owner.
- QR code per certificate linking straight to its verification page.
- Full wallet UX: MetaMask-not-installed, wrong network, rejected
  connections, rejected/pending/failed transactions.

## Architecture

```
   MetaMask
      │
      ▼
React + Vite + TS frontend
      │           │
   ethers.js     Pinata (IPFS)
      │
      ▼
Sepolia — SoulboundCredential.sol
```

No custom backend or database — the contract and IPFS are the only
persistence layers, by design (see "24-hour priority" in the original
brief).

## Tech stack

- **Contract**: Solidity 0.8.24, Hardhat, OpenZeppelin Contracts v5
- **Chain**: Ethereum Sepolia testnet
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, ethers v6,
  react-router-dom, qrcode.react
- **Storage**: IPFS via Pinata

## Project structure

```
vericred/
├── contracts/SoulboundCredential.sol
├── test/SoulboundCredential.ts
├── scripts/deploy.ts
├── frontend/
│   ├── src/
│   │   ├── components/   Navbar, WalletConnect, StatusBadge, CertificateCard,
│   │   │                 CertificateForm, VerificationSearch, QRCard,
│   │   │                 TransactionStatus, IssuerStatus, NetworkGuard
│   │   ├── pages/        Landing, Issue, Verify, VerifyToken, Admin
│   │   ├── hooks/        useWallet
│   │   ├── lib/          contract.ts, ipfs.ts, readOnlyProvider.ts
│   │   └── config/       contract.ts (address, chain ID, ABI)
│   └── ...
├── .env.example
├── hardhat.config.ts
└── package.json
```

## Smart contract

`SoulboundCredential.sol` extends OpenZeppelin's `ERC721` and `Ownable`.

- **Soulbound enforcement**: overrides the single `_update` hook that
  OpenZeppelin v5 routes all mint/burn/transfer through. Mint (from the
  zero address) is allowed; any transfer of an already-owned token reverts
  with `SoulboundTransfer()`. `approve` and `setApprovalForAll` are
  hard-disabled the same way.
- **Issuer whitelist**: `authorizedIssuers` mapping, gated by `onlyOwner`
  `addIssuer` / `removeIssuer`.
- **Revocation**: a `revoked` flag per token, settable only by the
  original issuer or the contract owner — never a burn or transfer, so
  ownership history stays intact.
- **Custom errors** throughout (`NotAuthorizedIssuer`, `SoulboundTransfer`,
  `CredentialAlreadyRevoked`, `InvalidToken`, `ZeroAddress`,
  `UnauthorizedRevocation`, `EmptyMetadataURI`) for gas efficiency and clear
  revert reasons.
- **`getCredential(tokenId)`** returns student, issuer, metadata URI,
  revoked flag, and issue timestamp in a single call — the verification
  page uses this so it needs only one RPC round trip.
- **`getCredentialsByStudent(address)`** returns every token id ever
  issued to a wallet, maintained as an append-only list on each mint.
  Since credentials are soulbound and never burned, this always reflects
  the wallet's full credential set without needing a subgraph or indexer —
  this is what powers wallet-address lookups on the verification page.

## IPFS metadata

Each certificate's metadata follows this shape:

```json
{
  "name": "Alice Johnson - Blockchain Development Certificate",
  "description": "Educational credential issued by HackBlox University",
  "attributes": [
    { "trait_type": "Student", "value": "Alice Johnson" },
    { "trait_type": "Course", "value": "Blockchain Development" },
    { "trait_type": "Issue Date", "value": "2026-09-05" },
    { "trait_type": "Issuer", "value": "HackBlox University" }
  ]
}
```

Uploaded via Pinata's `pinJSONToIPFS` endpoint; the resulting `ipfs://<cid>`
URI is what's stored on-chain as the token's `tokenURI`.

## Local setup

```bash
git clone <your-repo-url> vericred
cd vericred
npm install
cp .env.example .env
```

Fill in `.env`:

```
SEPOLIA_RPC_URL=       # from Alchemy or Infura
PRIVATE_KEY=           # a dedicated TEST wallet's private key — never a real one
ETHERSCAN_API_KEY=     # optional, for contract verification
```

### Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `SEPOLIA_RPC_URL` | Hardhat | RPC endpoint for deploying to Sepolia |
| `PRIVATE_KEY` | Hardhat | Deployer wallet (test wallet only) |
| `ETHERSCAN_API_KEY` | Hardhat | Optional contract verification |
| `VITE_CONTRACT_ADDRESS` | Frontend | Deployed contract address |
| `VITE_CHAIN_ID` | Frontend | 11155111 for Sepolia |
| `VITE_PINATA_JWT` | Frontend | Pinata write-scoped JWT for uploading metadata |
| `VITE_PINATA_GATEWAY` | Frontend | Gateway used to fetch metadata back |
| `VITE_PUBLIC_RPC_URL` | Frontend | Public RPC so `/verify` works without a wallet |

## Running Hardhat

```bash
npm run compile
npm test
```

All 30+ tests (deployment, issuer management, minting, all four
transfer/approval soulbound vectors, revocation authorization, and validity
checks) must pass before deploying.

## Deploying the contract

**Local:**

```bash
npx hardhat node            # in one terminal
npm run deploy:local        # in another
```

**Sepolia:**

```bash
npm run deploy:sepolia
```

This prints the contract address, deployer, and Etherscan link, and writes
`deployments/sepolia.json` + `deployments/SoulboundCredential.abi.json`.

Copy the address into `frontend/.env` as `VITE_CONTRACT_ADDRESS`, and (for
full accuracy) copy the generated ABI into
`frontend/src/config/contract.ts`, replacing the placeholder `CONTRACT_ABI`.

## Running the frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in VITE_CONTRACT_ADDRESS and VITE_PINATA_JWT
npm run dev
```

Visit `http://localhost:5173`.

## Deploying the frontend

```bash
cd frontend
npm run build
```

Deploy the `frontend` directory to Vercel (root directory set to
`frontend/`). `vercel.json` includes a SPA rewrite so `/verify/:tokenId`
resolves correctly on refresh. Set the same environment variables in the
Vercel project settings.

## Using the issuer dashboard

1. Go to `/issue` and connect a wallet.
2. If the wallet is on the authorized-issuer whitelist, the issuance form
   appears.
3. Fill in the student's wallet address, name, course, date, and
   institution, then click **Issue Certificate**.
4. The app uploads metadata to IPFS, calls `issueCredential`, waits for the
   transaction, and shows the resulting certificate with its token ID,
   transaction hash, verification link, and QR code.

## Verifying a certificate

- `/verify` — enter a token ID or a wallet address.
- `/verify/:tokenId` — direct link (what the QR code points to). Loads
  entirely from a public RPC provider and IPFS; no wallet needed.
- `/verify/wallet/:address` — lists every certificate issued to that
  wallet, each linking through to its own `/verify/:tokenId` page.

## Revoking a certificate

On `/admin`, the contract owner or the original issuer can enter a token ID
under "Revoke a credential" and submit. The credential's owner and history
are untouched — only its validity flips to `REVOKED`, immediately visible
on its verification page.

## Hackathon demo flow

1. Open VeriCred, connect the admin wallet, add an issuer address on
   `/admin`.
2. Switch MetaMask to the issuer wallet, go to `/issue` — status now shows
   **Authorized**.
3. Issue a certificate for Alice Johnson / Blockchain Development /
   HackBlox University / today's date.
4. Confirm the MetaMask transaction; watch it go pending → confirmed.
5. See the resulting certificate, token ID, and QR code.
6. Open `/verify/<tokenId>` — shows **VALID** with all details, IPFS
   metadata link, and Etherscan link, with no wallet connected.
7. Scan the QR code from a phone — same page loads.
8. Attempt a transfer from Etherscan's "Write Contract" tab (or a script)
   — it reverts with `SoulboundTransfer`.
9. On `/admin`, revoke the token.
10. Refresh the verification page — now shows **REVOKED**.

## Security notes

- Soulbound behavior is enforced at the `_update` hook level (OpenZeppelin
  v5), not by overriding individual transfer functions, which avoids
  missing a bypass path. `approve`/`setApprovalForAll` are separately
  disabled since they don't route through `_update`.
- Only the contract owner can add/remove issuers; only an authorized
  issuer can mint; only the original issuer or the owner can revoke.
- The frontend never touches a blockchain private key — `PRIVATE_KEY` is a
  Hardhat/deploy-time-only variable.
- The Pinata JWT is a write-scoped pinning credential (not a blockchain
  key), but since it's bundled into the Vite build it is still visible to
  anyone inspecting the frontend. For a production deployment, proxy IPFS
  uploads through a minimal backend so the JWT never ships to the browser.
- Custom errors avoid string-based `require` messages, reducing gas cost
  and making revert reasons unambiguous in tests and in MetaMask.

## Future improvements

- Multi-tier issuer hierarchy (university admin → department admin →
  issuer) using OpenZeppelin `AccessControl` roles instead of a flat
  whitelist.
- Batch issuance for a full class roster in one transaction.
- ENS resolution for student/issuer addresses in the UI.
- A subgraph or indexer so `/verify` can list all credentials for a given
  wallet without knowing token IDs in advance.
- Contract verification on Etherscan as part of the deploy script.
