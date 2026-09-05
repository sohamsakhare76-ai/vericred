// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SoulboundCredential
/// @notice Non-transferable ERC-721 educational credentials, minted only by
///         whitelisted issuer addresses, with on-chain revocation status and
///         off-chain (IPFS) metadata.
/// @dev Built for VeriCred — HackBlox 2026 Web3 Track.
contract SoulboundCredential is ERC721, Ownable {
    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------
    error NotAuthorizedIssuer();
    error SoulboundTransfer();
    error CredentialAlreadyRevoked();
    error InvalidToken();
    error ZeroAddress();
    error UnauthorizedRevocation();
    error EmptyMetadataURI();

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    /// @notice Addresses allowed to issue (mint) credentials.
    mapping(address => bool) public authorizedIssuers;

    /// @notice tokenId => IPFS metadata URI (e.g. ipfs://<cid>).
    mapping(uint256 => string) private _credentialURIs;

    /// @notice tokenId => issuer address that minted it.
    mapping(uint256 => address) public credentialIssuers;

    /// @notice tokenId => revoked flag.
    mapping(uint256 => bool) public revoked;

    /// @notice tokenId => timestamp the credential was issued.
    mapping(uint256 => uint256) public issuedAt;

    /// @dev Tracks whether a tokenId has ever been minted (survives no burn,
    ///      but guards lookups since we never burn credentials).
    mapping(uint256 => bool) private _exists_;

    /// @notice student address => list of token ids issued to them.
    /// @dev Enables the public verification page to look up "all
    ///      certificates for this wallet" without a subgraph or indexer.
    ///      Since credentials are never transferred or burned, this list is
    ///      append-only and always accurate.
    mapping(address => uint256[]) private _credentialsByStudent;

    uint256 public nextTokenId;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed student,
        address indexed issuer,
        string metadataURI
    );
    event CredentialRevoked(uint256 indexed tokenId, address indexed issuer);

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(
        address initialOwner
    ) ERC721("VeriCred", "VCRED") Ownable(initialOwner) {}

    // ---------------------------------------------------------------------
    // Issuer management (owner only)
    // ---------------------------------------------------------------------

    function addIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddress();
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function removeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    // ---------------------------------------------------------------------
    // Credential issuance
    // ---------------------------------------------------------------------

    /// @notice Mint a new soulbound credential to `student`.
    /// @param student The recipient wallet. Cannot be the zero address.
    /// @param metadataURI IPFS URI pointing to the credential's JSON metadata.
    /// @return tokenId The newly minted token id.
    function issueCredential(
        address student,
        string calldata metadataURI
    ) external returns (uint256 tokenId) {
        if (!authorizedIssuers[msg.sender]) revert NotAuthorizedIssuer();
        if (student == address(0)) revert ZeroAddress();
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        tokenId = nextTokenId++;

        _credentialURIs[tokenId] = metadataURI;
        credentialIssuers[tokenId] = msg.sender;
        issuedAt[tokenId] = block.timestamp;
        _exists_[tokenId] = true;
        _credentialsByStudent[student].push(tokenId);

        _safeMint(student, tokenId);

        emit CredentialIssued(tokenId, student, msg.sender, metadataURI);
    }

    // ---------------------------------------------------------------------
    // Revocation
    // ---------------------------------------------------------------------

    /// @notice Revoke a credential's validity without transferring or
    ///         burning it. Callable by the original issuer or the contract
    ///         owner (e.g. university admin).
    function revokeCredential(uint256 tokenId) external {
        if (!_exists_[tokenId]) revert InvalidToken();

        address issuer = credentialIssuers[tokenId];
        if (msg.sender != issuer && msg.sender != owner()) {
            revert UnauthorizedRevocation();
        }

        if (revoked[tokenId]) revert CredentialAlreadyRevoked();

        revoked[tokenId] = true;

        emit CredentialRevoked(tokenId, msg.sender);
    }

    // ---------------------------------------------------------------------
    // Public read helpers
    // ---------------------------------------------------------------------

    /// @notice Returns true if a token exists and has not been revoked.
    function isValid(uint256 tokenId) external view returns (bool) {
        if (!_exists_[tokenId]) revert InvalidToken();
        return !revoked[tokenId];
    }

    struct CredentialInfo {
        address student;
        address issuer;
        string metadataURI;
        bool isRevoked;
        uint256 issuedAtTimestamp;
    }

    /// @notice Returns full on-chain details for a credential in one call —
    ///         convenient for the public verification page.
    function getCredential(
        uint256 tokenId
    ) external view returns (CredentialInfo memory info) {
        if (!_exists_[tokenId]) revert InvalidToken();
        info = CredentialInfo({
            student: ownerOf(tokenId),
            issuer: credentialIssuers[tokenId],
            metadataURI: _credentialURIs[tokenId],
            isRevoked: revoked[tokenId],
            issuedAtTimestamp: issuedAt[tokenId]
        });
    }

    /// @notice Returns every token id ever issued to `student`. Since
    ///         credentials are soulbound and never burned, this list always
    ///         reflects the wallet's full, current credential set.
    function getCredentialsByStudent(
        address student
    ) external view returns (uint256[] memory) {
        return _credentialsByStudent[student];
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        if (!_exists_[tokenId]) revert InvalidToken();
        return _credentialURIs[tokenId];
    }

    // ---------------------------------------------------------------------
    // Soulbound enforcement
    // ---------------------------------------------------------------------
    // OpenZeppelin v5 routes mint / burn / transfer through a single
    // internal hook: `_update`. Minting is when `auth`/`from` is the zero
    // address (handled by super._update returning previous owner = 0), and
    // burning is when `to` is the zero address. We allow both of those but
    // block any transfer where both `from` and `to` are non-zero.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)). Block everything else that
        // looks like a transfer between two real owners. We do not support
        // burning either, since revocation (not destruction) is the
        // intended lifecycle — but if `to == address(0)` were ever needed,
        // this line would need loosening. For now, any transfer of an
        // already-existing token is soulbound-blocked.
        if (from != address(0)) {
            revert SoulboundTransfer();
        }

        return super._update(to, tokenId, auth);
    }

    /// @dev Disable single-token approvals — nothing should ever be
    ///      transferable, so approving is meaningless and could be
    ///      confusing UX. We revert outright.
    function approve(address, uint256) public pure override {
        revert SoulboundTransfer();
    }

    /// @dev Disable operator approvals for the same reason as `approve`.
    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundTransfer();
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        if (!_exists_[tokenId]) revert InvalidToken();
        return address(0);
    }

    function isApprovedForAll(address, address) public pure override returns (bool) {
        return false;
    }
}
