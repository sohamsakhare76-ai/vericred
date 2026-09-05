import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <p className="font-serif text-sm uppercase tracking-[0.3em] text-seal-brass">
        HackBlox 2026 — Web3 Track
      </p>
      <h1 className="mt-4 font-serif text-5xl font-medium leading-tight sm:text-6xl">
        Instantly verifiable
        <br />
        educational credentials on-chain.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink-muted">
        VeriCred issues certificates as non-transferable NFTs, bound
        permanently to the student who earned them, and verifiable by anyone
        in seconds — no account, no wallet, no waiting on a registrar.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          to="/issue"
          className="border border-seal-brass px-6 py-3 text-sm text-seal-brass hover:bg-seal-brass hover:text-ink transition-colors"
        >
          Issue Certificate
        </Link>
        <Link
          to="/verify"
          className="border border-white/20 px-6 py-3 text-sm text-parchment hover:border-white/40 transition-colors"
        >
          Verify Certificate
        </Link>
      </div>

      <div className="mt-24 grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl">The problem</h2>
          <ul className="mt-4 space-y-2 text-ink-muted">
            <li>Paper and PDF certificates can be forged.</li>
            <li>Verifying a credential means calling a registrar's office.</li>
            <li>Records get lost across schools, platforms, and formats.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-2xl">What VeriCred does</h2>
          <ul className="mt-4 space-y-2 text-ink-muted">
            <li>Blockchain-backed, tamper-resistant issuance.</li>
            <li>Verifiable instantly by anyone, no wallet required.</li>
            <li>Bound permanently to the student's wallet — never resold.</li>
          </ul>
        </div>
      </div>

      <div className="mt-24 border-t border-white/10 pt-10">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-serif text-3xl text-seal-brass">Issue</p>
            <p className="mt-2 text-sm text-ink-muted">
              An authorized issuer creates the credential and uploads its
              metadata to IPFS.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl text-seal-brass">Store</p>
            <p className="mt-2 text-sm text-ink-muted">
              A soulbound NFT referencing that metadata is minted directly to
              the student's wallet.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl text-seal-brass">Verify</p>
            <p className="mt-2 text-sm text-ink-muted">
              Anyone can look up the token or scan its QR code to see live,
              on-chain status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
