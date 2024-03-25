// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.24;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

/// @title NFTLock is a simple contract to lock NFTs for a period of time
/// @notice The purpose of the contract is for UniV3 liquidity providers to have the ability to lock their liquidiy for a set amount of tim
/// @notice while the contract does handle any NFT, it is specifically designed for UniV3 NFTs
/// @notice this contract is designed to handle only ERC721 and ERC721 extension contracts, not for other styles of NFTs

contract NFTLock is ERC721Enumerable, IERC721Receiver, ReentrancyGuard {
  /// @dev internal counter for lockIds
  uint256 internal _lockIds;

  /// @dev struct to hold the lock information
  /// @param nft is the address of the nft that is being locked
  /// @param tokenId is the id of the nft token being locked
  /// @param unlockDate is the timestamp when the nft can be unlocked
  /// @param transferable is a boolean to determine if the lock can be transferred or not
  struct Lock {
    address nft;
    uint256 tokenId;
    uint256 unlockDate;
    bool transferable;
  }

  /// @dev mapping the Lock nftIds to the Lock struct, so that the lock information can be retrieved with the public getter function
  mapping(uint256 => Lock) public locks;

 /*********************EVENTS*********************************************************************************************/

  event LockCreated(
    uint256 indexed lockId,
    address indexed recipient,
    Lock lock
  );
  event LockExtended(uint256 indexed lockId, uint256 indexed tokenId, uint256 newUnlockDate);
  event NFTUnlocked(uint256 indexed lockId, uint256 indexed tokenId);

   /*********************CONSTRUCTOR*********************************************************************************************/

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

  /*****TOKEN ID FUNCTIONS*************************************************************************************/

  /// @notice this function is akin to the OZ counters function
  function incrementLockId() internal returns (uint256) {
    _lockIds++;
    return _lockIds;
  }

  /// @notice this function is akin to the OZ counters function
  function currentLockId() public view returns (uint256) {
    return _lockIds;
  }

  /// @notice this function pulls the UniNFT URI information and displays it for the lock
  function tokenURI(uint256 lockId) public view virtual override returns (string memory) {
    try IERC721Metadata(locks[lockId].nft).tokenURI(locks[lockId].tokenId) {
      return IERC721Metadata(locks[lockId].nft).tokenURI(locks[lockId].tokenId);
    } catch {
      return '';
    }
  }

  /****************EXTERNAL LOCK FUNCTIONS ********************************************************/

  /// @notice core funtion to lock an UniNFT. The sender will first have to approve this contract as the spender of their NFT
  /// @param recipient is the address of the recipient of the locked NFT
  /// @param lock is the struct that holds the lock information, input by the sender
  /// @dev this will physically pull the UniNFT from the sender into this contract for escrow, mint them a lockNFT and then store the lock information
  function lockNFT(address recipient, Lock memory lock) external nonReentrant returns (uint256 lockId) {
    require(lock.nft != address(0), '!nftaddress');
    if (recipient == address(0)) {
      recipient = msg.sender;
    }
    IERC721(lock.nft).transferFrom(msg.sender, address(this), lock.tokenId);
    lockId = _lockNFT(recipient, lock);
  }

  /// @notice alternative method for locking a UniNFT using the safeTransferFrom function and inputting properly formmated data for the lock
  /// @param operator is not used
  /// @param from is the address of the sender of the NFT
  /// @param tokenId is the id of the token being sent
  /// @param data is the callback data from the safeTransferFrom function that is used to input the lock information
  /// @dev the data should be the encoded recipient, unlockDate and transferable boolean
  /// @dev this checks to make sure the NFT has been received before performing the internal _lockNFT function and minting the recipient a lockNFT
  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external override nonReentrant returns (bytes4) {
    (address recipient, uint256 unlockDate, bool transferable) = abi.decode(data, (address, uint256, bool));
    require(IERC721(msg.sender).ownerOf(tokenId) == address(this));
    if (recipient == address(0)) {
      recipient = from;
    }
    Lock memory lock = Lock({nft: msg.sender, tokenId: tokenId, unlockDate: unlockDate, transferable: transferable});
    _lockNFT(recipient, lock);
    return this.onERC721Received.selector;
  }

  /// @notice function to extend the unlock date of a locked NFT
  /// @param lockId is the id of the lockNFT
  /// @param newUnlockDate is the new unlock date for the NFT
  /// @dev nothing moves, it just updates the lock id with the new unlock date
  function extendLock(uint256 lockId, uint256 newUnlockDate) external nonReentrant {
    require(ownerOf(lockId) == msg.sender, '!owner');
    require(newUnlockDate > locks[lockId].unlockDate, '!future');
    locks[lockId].unlockDate = newUnlockDate;
    emit LockExtended(lockId, locks[lockId].tokenId, newUnlockDate);
  }

  /// @notice function to unlock the NFT after the unlock date has passed
  /// @param lockId is the id of the lockNFT
  /// @dev this will transfer the NFT back to the owner and burn the lockNFT
  function unlockNFT(uint256 lockId) external nonReentrant {
    require(ownerOf(lockId) == msg.sender, '!owner');
    require(locks[lockId].unlockDate <= block.timestamp, 'locked');
    IERC721(locks[lockId].nft).transferFrom(address(this), msg.sender, locks[lockId].tokenId);
    _burn(lockId);
    emit NFTUnlocked(lockId, locks[lockId].tokenId);
    delete locks[lockId];
  }

  /*********************************INTERNAL FUNCTIONS **********************************************************/

  /// @dev internal function that mints the lockNFT and stores the lock information
  function _lockNFT(address recipient, Lock memory lock) internal returns (uint256 lockId) {
    lockId = incrementLockId();
    _mint(recipient, lockId);
    locks[lockId] = lock;
    emit LockCreated(lockId, recipient, lock);
  }

  /// @dev internal function overriding the _update function that checks if the lock NFT is transferable or not
  function _update(address to, uint256 lockId, address auth) internal virtual override returns (address) {
    if (auth != address(0x0)) {
      require(locks[lockId].transferable, '!transferable');
      return super._update(to, lockId, auth);
    } else {
      return super._update(to, lockId, address(0x0));
    }
  }
}
