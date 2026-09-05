import { VerificationSearch } from "../components/VerificationSearch";

export function Verify() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-serif text-3xl">Verify a Credential</h1>
      <p className="mt-4 text-ink-muted">
        Look up any VeriCred certificate by its token ID, or enter a wallet
        address to see every certificate issued to it. No wallet connection
        required.
      </p>
      <div className="mt-10 text-left">
        <VerificationSearch />
      </div>
    </div>
  );
}
