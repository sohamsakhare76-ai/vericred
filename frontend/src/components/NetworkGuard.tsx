import { useWallet } from "../hooks/useWallet";
import { CHAIN_NAME } from "../config/contract";

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { address, isCorrectNetwork, switchToSepolia } = useWallet();

  if (address && !isCorrectNetwork) {
    return (
      <div className="border border-seal-revoked/40 bg-seal-revoked/10 px-6 py-4 text-sm">
        <p className="text-seal-revoked">
          Wrong network detected. VeriCred runs on {CHAIN_NAME}.
        </p>
        <button
          onClick={switchToSepolia}
          className="mt-3 border border-seal-revoked px-4 py-2 text-seal-revoked hover:bg-seal-revoked hover:text-white transition-colors"
        >
          Switch to {CHAIN_NAME}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
