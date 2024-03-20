// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.24;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

contract NFTLock is ERC721Enumerable, IERC721Receiver, ReentrancyGuard {
  uint256 internal _lockIds;

  struct Lock {
    address nft;
    uint256 tokenId;
    uint256 unlockDate;
    bool transferable;
  }

  mapping(uint256 => Lock) public locks;

  event LockCreated(
    uint256 indexed lockId,
    address indexed nft,
    uint256 indexed tokenId,
    uint256 unlockDate,
    bool transferable
  );
  event LockExtended(uint256 indexed lockId, uint256 newUnlockDate);
  event NFTUnlocked(uint256 indexed lockId);

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

  /*****TOKEN ID FUNCTIONS*************************************************************************************/

  function incrementLockId() internal returns (uint256) {
    _lockIds++;
    return _lockIds;
  }

  function currentLockId() public view returns (uint256) {
    return _lockIds;
  }

  function tokenURI(uint256 lockId) public view virtual override returns (string memory) {
    try IERC721Metadata(locks[lockId].nft).tokenURI(locks[lockId].tokenId) {
      return IERC721Metadata(locks[lockId].nft).tokenURI(locks[lockId].tokenId);
    } catch {
      return '';
    }
  }

  /****************EXTERNAL LOCK FUNCTIONS ********************************************************/

  function lockNFT(address recipient, Lock memory lock) external nonReentrant returns (uint256 lockId) {
    require(lock.nft != address(0), '!nftaddress');
    require(lock.tokenId != 0, '!tokenId');
    if (recipient == address(0)) {
      recipient = msg.sender;
    }
    IERC721(lock.nft).transferFrom(msg.sender, address(this), lock.tokenId);
    lockId = _lockNFT(recipient, lock);
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata datas
  ) external override nonReentrant returns (bytes4) {
    (address recipient, uint256 unlockDate, bool transferable) = abi.decode(datas, (address, uint256, bool));
    if (recipient == address(0)) {
      recipient = from;
    }
    Lock memory lock = Lock({nft: msg.sender, tokenId: tokenId, unlockDate: unlockDate, transferable: transferable});
    _lockNFT(recipient, lock);
    return this.onERC721Received.selector;
  }

  function extendLockDuration(uint256 lockId, uint256 newUnlockDate) external nonReentrant {
    require(ownerOf(lockId) == msg.sender, '!owner');
    require(newUnlockDate > locks[lockId].unlockDate, '!future');
    locks[lockId].unlockDate = newUnlockDate;
    emit LockExtended(lockId, newUnlockDate);
  }

  function unlockNFT(uint256 lockId) external nonReentrant {
    require(ownerOf(lockId) == msg.sender, '!owner');
    require(locks[lockId].unlockDate <= block.timestamp, 'locked');
    IERC721(locks[lockId].nft).transferFrom(address(this), msg.sender, locks[lockId].tokenId);
    _burn(lockId);
    delete locks[lockId];
    emit NFTUnlocked(lockId);
  }

  /*********************************INTERNAL FUNCTIONS **********************************************************/

  function _lockNFT(address recipient, Lock memory lock) internal returns (uint256 lockId) {
    lockId = incrementLockId();
    _mint(recipient, lockId);
    locks[lockId] = lock;
    emit LockCreated(lockId, lock.nft, lock.tokenId, lock.unlockDate, lock.transferable);
  }

  function _update(address to, uint256 lockId, address auth) internal virtual override returns (address) {
    if (auth != address(0x0)) {
      require(locks[lockId].transferable, '!transferable');
      return super._update(to, lockId, auth);
    } else {
      return super._update(to, lockId, address(0x0));
    }
  }
}
