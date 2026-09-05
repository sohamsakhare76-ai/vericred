import { useCallback, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { CHAIN_ID_HEX, SEPOLIA_PARAMS } from "../config/contract";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export type WalletState = {
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  isMetaMaskInstalled: boolean;
  isCorrectNetwork: boolean;
};

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    connecting: false,
    error: null,
    isMetaMaskInstalled: typeof window !== "undefined" && !!window.ethereum,
    isCorrectNetwork: false,
  });

  const refreshChain = useCallback(async () => {
    if (!window.ethereum) return;
    const hexChainId: string = await window.ethereum.request({
      method: "eth_chainId",
    });
    const chainId = parseInt(hexChainId, 16);
    setState((s) => ({
      ...s,
      chainId,
      isCorrectNetwork: hexChainId.toLowerCase() === CHAIN_ID_HEX.toLowerCase(),
    }));
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((s) => ({
        ...s,
        error: "MetaMask is not installed. Install it to continue.",
      }));
      return;
    }
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      await refreshChain();
      setState((s) => ({
        ...s,
        address: accounts[0] ?? null,
        connecting: false,
      }));
    } catch (err: any) {
      const message =
        err?.code === 4001
          ? "Connection request was rejected."
          : err?.message || "Failed to connect wallet.";
      setState((s) => ({ ...s, connecting: false, error: message }));
    }
  }, [refreshChain]);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID_HEX }],
      });
    } catch (err: any) {
      // Chain not added to MetaMask yet.
      if (err?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [SEPOLIA_PARAMS],
        });
      } else if (err?.code === 4001) {
        setState((s) => ({
          ...s,
          error: "Network switch was rejected.",
        }));
      }
    }
    await refreshChain();
  }, [refreshChain]);

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed.");
    const provider = new BrowserProvider(window.ethereum);
    return provider.getSigner();
  }, []);

  const getProvider = useCallback(() => {
    if (!window.ethereum) return null;
    return new BrowserProvider(window.ethereum);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    // Restore existing connection without prompting.
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts[0]) {
          setState((s) => ({ ...s, address: accounts[0] }));
          refreshChain();
        }
      });

    const handleAccountsChanged = (accounts: string[]) => {
      setState((s) => ({ ...s, address: accounts[0] ?? null }));
    };
    const handleChainChanged = () => {
      refreshChain();
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );
      window.ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [refreshChain]);

  return { ...state, connect, switchToSepolia, getSigner, getProvider };
}
