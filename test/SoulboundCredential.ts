import { expect } from "chai";
import { ethers } from "hardhat";
import { SoulboundCredential } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const SAMPLE_URI = "ipfs://bafybeigsamplecidforcredentialmetadata";
const SAMPLE_URI_2 = "ipfs://bafybeigsecondsamplecidmetadata";

describe("SoulboundCredential", function () {
  let contract: SoulboundCredential;
  let owner: SignerWithAddress;
  let issuer: SignerWithAddress;
  let issuer2: SignerWithAddress;
  let student: SignerWithAddress;
  let student2: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    [owner, issuer, issuer2, student, student2, stranger] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SoulboundCredential");
    contract = (await Factory.deploy(
      owner.address
    )) as unknown as SoulboundCredential;
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("sets the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("sets the correct name and symbol", async function () {
      expect(await contract.name()).to.equal("VeriCred");
      expect(await contract.symbol()).to.equal("VCRED");
    });

    it("starts with nextTokenId at 0", async function () {
      expect(await contract.nextTokenId()).to.equal(0);
    });

    it("has no authorized issuers initially", async function () {
      expect(await contract.authorizedIssuers(issuer.address)).to.equal(
        false
      );
    });
  });

  describe("Issuer management", function () {
    it("allows the owner to add an issuer", async function () {
      await expect(contract.connect(owner).addIssuer(issuer.address))
        .to.emit(contract, "IssuerAdded")
        .withArgs(issuer.address);
      expect(await contract.authorizedIssuers(issuer.address)).to.equal(true);
    });

    it("allows the owner to remove an issuer", async function () {
      await contract.connect(owner).addIssuer(issuer.address);
      await expect(contract.connect(owner).removeIssuer(issuer.address))
        .to.emit(contract, "IssuerRemoved")
        .withArgs(issuer.address);
      expect(await contract.authorizedIssuers(issuer.address)).to.equal(
        false
      );
    });

    it("reverts if a non-owner tries to add an issuer", async function () {
      await expect(
        contract.connect(stranger).addIssuer(issuer.address)
      ).to.be.revertedWithCustomError(
        contract,
        "OwnableUnauthorizedAccount"
      );
    });

    it("reverts when adding the zero address as an issuer", async function () {
      await expect(
        contract.connect(owner).addIssuer(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("supports multiple independent issuers", async function () {
      await contract.connect(owner).addIssuer(issuer.address);
      await contract.connect(owner).addIssuer(issuer2.address);
      expect(await contract.authorizedIssuers(issuer.address)).to.equal(true);
      expect(await contract.authorizedIssuers(issuer2.address)).to.equal(
        true
      );
    });
  });

  describe("Credential issuance", function () {
    beforeEach(async function () {
      await contract.connect(owner).addIssuer(issuer.address);
    });

    it("allows an authorized issuer to mint a credential", async function () {
      await expect(
        contract.connect(issuer).issueCredential(student.address, SAMPLE_URI)
      )
        .to.emit(contract, "CredentialIssued")
        .withArgs(0, student.address, issuer.address, SAMPLE_URI);
    });

    it("reverts if an unauthorized address tries to mint", async function () {
      await expect(
        contract
          .connect(stranger)
          .issueCredential(student.address, SAMPLE_URI)
      ).to.be.revertedWithCustomError(contract, "NotAuthorizedIssuer");
    });

    it("reverts if minting to the zero address", async function () {
      await expect(
        contract
          .connect(issuer)
          .issueCredential(ethers.ZeroAddress, SAMPLE_URI)
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("reverts if metadata URI is empty", async function () {
      await expect(
        contract.connect(issuer).issueCredential(student.address, "")
      ).to.be.revertedWithCustomError(contract, "EmptyMetadataURI");
    });

    it("mints the NFT to the student's wallet", async function () {
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
      expect(await contract.ownerOf(0)).to.equal(student.address);
    });

    it("stores the correct tokenURI", async function () {
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
      expect(await contract.tokenURI(0)).to.equal(SAMPLE_URI);
    });

    it("records the issuer that minted the credential", async function () {
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
      expect(await contract.credentialIssuers(0)).to.equal(issuer.address);
    });

    it("increments tokenId across multiple credentials", async function () {
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
      await contract
        .connect(issuer)
        .issueCredential(student2.address, SAMPLE_URI_2);
      expect(await contract.ownerOf(0)).to.equal(student.address);
      expect(await contract.ownerOf(1)).to.equal(student2.address);
      expect(await contract.nextTokenId()).to.equal(2);
    });

    it("supports multiple issuers minting independently", async function () {
      await contract.connect(owner).addIssuer(issuer2.address);
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
      await contract
        .connect(issuer2)
        .issueCredential(student2.address, SAMPLE_URI_2);
      expect(await contract.credentialIssuers(0)).to.equal(issuer.address);
      expect(await contract.credentialIssuers(1)).to.equal(issuer2.address);
    });
  });

  describe("Soulbound transfer prevention", function () {
    beforeEach(async function () {
      await contract.connect(owner).addIssuer(issuer.address);
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
    });

    it("reverts on transferFrom", async function () {
      await expect(
        contract
          .connect(student)
          .transferFrom(student.address, student2.address, 0)
      ).to.be.revertedWithCustomError(contract, "SoulboundTransfer");
    });

    it("reverts on safeTransferFrom (without data)", async function () {
      await expect(
        contract
          .connect(student)
          ["safeTransferFrom(address,address,uint256)"](
            student.address,
            student2.address,
            0
          )
      ).to.be.revertedWithCustomError(contract, "SoulboundTransfer");
    });

    it("reverts on safeTransferFrom (with data)", async function () {
      await expect(
        contract
          .connect(student)
          ["safeTransferFrom(address,address,uint256,bytes)"](
            student.address,
            student2.address,
            0,
            "0x"
          )
      ).to.be.revertedWithCustomError(contract, "SoulboundTransfer");
    });

    it("reverts on approve", async function () {
      await expect(
        contract.connect(student).approve(stranger.address, 0)
      ).to.be.revertedWithCustomError(contract, "SoulboundTransfer");
    });

    it("reverts on setApprovalForAll", async function () {
      await expect(
        contract.connect(student).setApprovalForAll(stranger.address, true)
      ).to.be.revertedWithCustomError(contract, "SoulboundTransfer");
    });

    it("getApproved always returns the zero address", async function () {
      expect(await contract.getApproved(0)).to.equal(ethers.ZeroAddress);
    });

    it("isApprovedForAll always returns false", async function () {
      expect(
        await contract.isApprovedForAll(student.address, stranger.address)
      ).to.equal(false);
    });

    it("does not block minting itself (sanity check)", async function () {
      await expect(
        contract
          .connect(issuer)
          .issueCredential(student2.address, SAMPLE_URI_2)
      ).to.not.be.reverted;
    });
  });

  describe("Revocation", function () {
    beforeEach(async function () {
      await contract.connect(owner).addIssuer(issuer.address);
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
    });

    it("allows the issuing issuer to revoke", async function () {
      await expect(contract.connect(issuer).revokeCredential(0))
        .to.emit(contract, "CredentialRevoked")
        .withArgs(0, issuer.address);
      expect(await contract.revoked(0)).to.equal(true);
    });

    it("allows the contract owner to revoke", async function () {
      await expect(contract.connect(owner).revokeCredential(0))
        .to.emit(contract, "CredentialRevoked")
        .withArgs(0, owner.address);
      expect(await contract.revoked(0)).to.equal(true);
    });

    it("reverts if an unrelated address tries to revoke", async function () {
      await expect(
        contract.connect(stranger).revokeCredential(0)
      ).to.be.revertedWithCustomError(contract, "UnauthorizedRevocation");
    });

    it("reverts if another issuer (not the original) tries to revoke", async function () {
      await contract.connect(owner).addIssuer(issuer2.address);
      await expect(
        contract.connect(issuer2).revokeCredential(0)
      ).to.be.revertedWithCustomError(contract, "UnauthorizedRevocation");
    });

    it("reverts when revoking an already-revoked credential", async function () {
      await contract.connect(issuer).revokeCredential(0);
      await expect(
        contract.connect(issuer).revokeCredential(0)
      ).to.be.revertedWithCustomError(contract, "CredentialAlreadyRevoked");
    });

    it("reverts when revoking a nonexistent token", async function () {
      await expect(
        contract.connect(issuer).revokeCredential(999)
      ).to.be.revertedWithCustomError(contract, "InvalidToken");
    });

    it("keeps the student as owner after revocation (no burn/transfer)", async function () {
      await contract.connect(issuer).revokeCredential(0);
      expect(await contract.ownerOf(0)).to.equal(student.address);
    });
  });

  describe("Validity checks", function () {
    beforeEach(async function () {
      await contract.connect(owner).addIssuer(issuer.address);
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
    });

    it("isValid returns true before revocation", async function () {
      expect(await contract.isValid(0)).to.equal(true);
    });

    it("isValid returns false after revocation", async function () {
      await contract.connect(issuer).revokeCredential(0);
      expect(await contract.isValid(0)).to.equal(false);
    });

    it("reverts isValid for a nonexistent token", async function () {
      await expect(contract.isValid(999)).to.be.revertedWithCustomError(
        contract,
        "InvalidToken"
      );
    });

    it("reverts tokenURI for a nonexistent token", async function () {
      await expect(contract.tokenURI(999)).to.be.revertedWithCustomError(
        contract,
        "InvalidToken"
      );
    });

    it("reverts getCredential for a nonexistent token", async function () {
      await expect(contract.getCredential(999)).to.be.revertedWithCustomError(
        contract,
        "InvalidToken"
      );
    });

    it("getCredential returns full, correct details", async function () {
      const info = await contract.getCredential(0);
      expect(info.student).to.equal(student.address);
      expect(info.issuer).to.equal(issuer.address);
      expect(info.metadataURI).to.equal(SAMPLE_URI);
      expect(info.isRevoked).to.equal(false);
    });
  });

  describe("Lookup by wallet address", function () {
    beforeEach(async function () {
      await contract.connect(owner).addIssuer(issuer.address);
    });

    it("returns an empty array for a wallet with no credentials", async function () {
      const tokenIds = await contract.getCredentialsByStudent(
        stranger.address
      );
      expect(tokenIds.length).to.equal(0);
    });

    it("returns the token id after a single credential is issued", async function () {
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
      const tokenIds = await contract.getCredentialsByStudent(
        student.address
      );
      expect(tokenIds.map((t) => t.toString())).to.deep.equal(["0"]);
    });

    it("returns all token ids when a student holds multiple credentials", async function () {
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI_2);
      const tokenIds = await contract.getCredentialsByStudent(
        student.address
      );
      expect(tokenIds.map((t) => t.toString())).to.deep.equal(["0", "1"]);
    });

    it("does not mix up token ids between different students", async function () {
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
      await contract
        .connect(issuer)
        .issueCredential(student2.address, SAMPLE_URI_2);
      const studentTokens = await contract.getCredentialsByStudent(
        student.address
      );
      const student2Tokens = await contract.getCredentialsByStudent(
        student2.address
      );
      expect(studentTokens.map((t) => t.toString())).to.deep.equal(["0"]);
      expect(student2Tokens.map((t) => t.toString())).to.deep.equal(["1"]);
    });

    it("still lists a revoked credential's token id (list reflects issuance, not validity)", async function () {
      await contract
        .connect(issuer)
        .issueCredential(student.address, SAMPLE_URI);
      await contract.connect(issuer).revokeCredential(0);
      const tokenIds = await contract.getCredentialsByStudent(
        student.address
      );
      expect(tokenIds.map((t) => t.toString())).to.deep.equal(["0"]);
    });
  });
});
