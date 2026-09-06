import { Contract, ContractRunner } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";

export function getContract(signerOrProvider: ContractRunner) {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address is not configured. Set VITE_CONTRACT_ADDRESS in frontend/.env."
    );
  }
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

export type CredentialInfo = {
  student: string;
  issuer: string;
  metadataURI: string;
  isRevoked: boolean;
  issuedAtTimestamp: bigint;
};

/** Read-only lookup usable without a connected wallet (uses a public RPC provider). */
export async function readCredential(
  provider: ContractRunner,
  tokenId: number
): Promise<CredentialInfo> {
  const contract = getContract(provider);
  const info = await contract.getCredential(tokenId);
  return {
    student: info.student,
    issuer: info.issuer,
    metadataURI: info.metadataURI,
    isRevoked: info.isRevoked,
    issuedAtTimestamp: info.issuedAtTimestamp,
  };
}