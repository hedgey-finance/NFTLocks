// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.19;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract LiquidityLocks is ERC721Enumerable, ReentrancyGuard {

    using Counters for Counters.Counter;
    Counters.Counter private _lockIds;
    
    struct Lock {
        address nft;
        uint256 tokenId;
        uint256 unlockDate;
        bool transferable;
    }

    mapping(uint256 => Lock) public locks;

    event LockCreated(uint256 indexed lockId, address indexed nft, uint256 indexed tokenId, uint256 unlockDate, bool transferable);
    event LockExtended(uint256 indexed lockId, uint256 newUnlockDate);
    event NFTUnlocked(uint256 indexed lockId);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) { }

    // function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external override returns (bytes4) {
    //     return this.onERC721Received.selector;
    // }

    function lockNFT(address recipient, address nft, uint256 tokenId, uint256 unlockDate, bool transferable) external nonReentrant returns (uint256 lockId) {
        //require statements
        require(recipient != address(0), "!address");
        require(nft != address(0), "!nftaddress");
        require(tokenId != 0, "!tokenId");
        require(unlockDate > block.timestamp, "!unlockFuture");
        _lockIds.increment();
        lockId = _lockIds.current();
        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);
        _safeMint(recipient, lockId);
        locks[lockId] = Lock(nft, tokenId, unlockDate, transferable);
        emit LockCreated(lockId, nft, tokenId, unlockDate, transferable);
    }

    function extendLockDuration(uint256 lockId, uint256 newUnlockDate) external nonReentrant {
        require(ownerOf(lockId) == msg.sender, "!owner");
        require(newUnlockDate > locks[lockId].unlockDate, "!future");
        locks[lockId].unlockDate = newUnlockDate;
        emit LockExtended(lockId, newUnlockDate);
    }

    function unlockNFT(uint256 lockId) external nonReentrant {
        require(ownerOf(lockId) == msg.sender, "!owner");
        require(locks[lockId].unlockDate <= block.timestamp, "locked");
        IERC721(locks[lockId].nft).transferFrom(address(this), msg.sender, locks[lockId].tokenId);
        _burn(lockId);
        delete locks[lockId];
        emit NFTUnlocked(lockId);
    }

    function tokenURI(uint256 lockId) public view virtual override returns (string memory) {
        _requireMinted(lockId);
        return IERC721Metadata(locks[lockId].nft).tokenURI(locks[lockId].tokenId);
    }

}