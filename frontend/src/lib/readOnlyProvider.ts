import { JsonRpcProvider } from "ethers";

// A public Sepolia RPC used so /verify pages work without MetaMask
// installed or connected. Swap for a dedicated Alchemy/Infura endpoint
// (via VITE_PUBLIC_RPC_URL) for reliability in production.
const PUBLIC_RPC_URL =
  import.meta.env.VITE_PUBLIC_RPC_URL || "https://rpc.sepolia.org";

let cachedProvider: JsonRpcProvider | null = null;

export function getReadOnlyProvider(): JsonRpcProvider {
  if (!cachedProvider) {
    cachedProvider = new JsonRpcProvider(PUBLIC_RPC_URL);
  }
  return cachedProvider;
}
