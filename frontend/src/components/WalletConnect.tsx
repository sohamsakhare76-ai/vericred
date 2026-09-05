import { useWallet } from "../hooks/useWallet";

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnect() {
  const {
    address,
    connecting,
    isMetaMaskInstalled,
    isCorrectNetwork,
    connect,
    switchToSepolia,
  } = useWallet();

  if (!isMetaMaskInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
        className="rounded-none border border-seal-brass px-4 py-2 text-sm text-seal-brass hover:bg-seal-brass hover:text-ink transition-colors"
      >
        Install MetaMask
      </a>
    );
  }

  if (!address) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="border border-seal-brass px-4 py-2 text-sm text-seal-brass hover:bg-seal-brass hover:text-ink transition-colors disabled:opacity-50"
      >
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <button
        onClick={switchToSepolia}
        className="border border-seal-revoked px-4 py-2 text-sm text-seal-revoked hover:bg-seal-revoked hover:text-white transition-colors"
      >
        Switch to Sepolia
      </button>
    );
  }

  return (
    <div className="border border-white/15 px-4 py-2 text-sm text-parchment">
      {shorten(address)}
    </div>
  );
}
