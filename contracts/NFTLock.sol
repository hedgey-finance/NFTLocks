// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.24;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface INPM {
  struct CollectParams {
    uint256 tokenId;
    address recipient;
    uint128 amount0Max;
    uint128 amount1Max;
  }

  function positions(
    uint256 tokenId
  )
    external
    view
    returns (
      uint96 nonce,
      address operator,
      address token0,
      address token1,
      uint24 fee,
      int24 tickLower,
      int24 tickUpper,
      uint128 liquidity,
      uint256 feeGrowthInside0LastX128,
      uint256 feeGrowthInside1LastX128,
      uint128 tokensOwed0,
      uint128 tokensOwed1
    );

  function collect(CollectParams calldata params) external payable returns (uint256 amount0, uint256 amount1);
}

/// @title NFTLock is a simple contract to lock NFTs for a period of time
/// @notice The purpose of the contract is for UniV3 liquidity providers to have the ability to lock their liquidiy for a set amount of tim
/// @notice while the contract does handle any NFT, it is specifically designed for UniV3 NFTs
/// @notice this contract is designed to handle only ERC721 and ERC721 extension contracts, not for other styles of NFTs

contract NFTLock is ERC721Enumerable, IERC721Receiver, ReentrancyGuard {
  /// @dev internal counter for lockIds
  uint256 internal _lockIds;

  /// @dev address of the fee collector
  address internal _feeCollector;

  /// @dev max fee percent that the fee collector can set, in basis points divided by 10,000, set to max of 10%
  uint256 internal _maxFeePercent;

  /// @dev general fee percent that the fee collector will set for all locks at the time they get locked. Once locked the fee cannot be changed, but each lock will adopt the general fee at the time of locking
  uint256 internal _generalFeePercent;

  /// @dev mapping of the lockId to the fee percent for each lock that is created at each lock
  mapping(uint256 => uint256) internal _feePercents;

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

  event LockCreated(uint256 indexed lockId, address indexed recipient, Lock lock, uint256 feePercent);
  event LockExtended(uint256 indexed lockId, uint256 indexed tokenId, uint256 newUnlockDate);
  event NFTUnlocked(uint256 indexed lockId, uint256 indexed tokenId);
  event NewFeeColletor(address indexed feeCollector);
  event NewFeePercent(uint256 indexed feePercent);

  /*********************CONSTRUCTOR*********************************************************************************************/

  constructor(string memory name, string memory symbol, address feeCollector, uint256 feePercent, uint256 maxFee) ERC721(name, symbol) {
    require(feeCollector != address(0), '!feeCollector');
    require(feePercent < _maxFeePercent, '< maxFee');
    _feeCollector = feeCollector;
    _generalFeePercent = feePercent;
    _maxFeePercent = maxFee;
  }

  /*********************COLLECTOR FUNCTIONS*********************************************************************************************/

  function changeFeeCollector(address newCollector) external {
    require(msg.sender == _feeCollector, '!feeCollector');
    _feeCollector = newCollector;
    emit NewFeeColletor(newCollector);
  }

  function changeFeePercent(uint256 newFeePercent) external {
    require(msg.sender == _feeCollector, '!feeCollector');
    require(newFeePercent < _maxFeePercent, '< maxFee');
    _generalFeePercent = newFeePercent;
    emit NewFeePercent(newFeePercent);
  }

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


  /***********************PUBLIC VIEW FUNCTIONS*********************************************************************/

  /// @notice this function pulls the UniNFT URI information and displays it for the lock
  function tokenURI(uint256 lockId) public view virtual override returns (string memory) {
    try IERC721Metadata(locks[lockId].nft).tokenURI(locks[lockId].tokenId) {
      return IERC721Metadata(locks[lockId].nft).tokenURI(locks[lockId].tokenId);
    } catch {
      return '';
    }
  }

  function getLockFee(uint256 lockId) public view returns (uint256) {
    return _feePercents[lockId];
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

  /// @notice Function to collect fees from the locked Uniswapv3 NFT
  /// the function will transfer tokens back to this address
  /// then it will use the internal transfer function to transfer the fees to the owner of the NFT and the fee collector
  function collectFees(uint256 lockId) external nonReentrant returns (uint256 amount0, uint256 amount1) {
    require(ownerOf(lockId) == msg.sender, '!owner');
    address npmAddress = locks[lockId].nft;
    INPM.CollectParams memory params = INPM.CollectParams({
      tokenId: locks[lockId].tokenId,
      recipient: address(this),
      amount0Max: type(uint128).max,
      amount1Max: type(uint128).max
    });
    try INPM(npmAddress).positions(locks[lockId].tokenId) {
      (amount0, amount1) = INPM(npmAddress).collect(params);
      (, , address token0, address token1, , , , , , , , ) = INPM(npmAddress).positions(locks[lockId].tokenId);
      uint256 feePercent = _feePercents[lockId];
      _transferTokens(msg.sender, token0, token1, amount0, amount1, feePercent);
    } catch {
      return (0, 0);
    }
  }

  /*********************************INTERNAL FUNCTIONS **********************************************************/

  /// @dev internal function that mints the lockNFT and stores the lock information
  function _lockNFT(address recipient, Lock memory lock) internal returns (uint256 lockId) {
    lockId = incrementLockId();
    _mint(recipient, lockId);
    locks[lockId] = lock;
    _feePercents[lockId] = _generalFeePercent;
    emit LockCreated(lockId, recipient, lock, _generalFeePercent);
  }

  /// @dev internal function for calculating fees
  /// fees can never be set more thatn 10,000 which is in basis points
  /// function will take total amount * fee amount and divide by 10,000, fee will be deducted from the total amount
  function _feeCalculation(uint256 tokenAmount, uint256 feePercent) internal pure returns (uint256) {
    return (tokenAmount * feePercent) / 10000;
  }

  /// @dev internal funciton to transfer tokens and fees in a single function call
  /// function checks if the amounts are greater than 0, otherwise ignores them, then calculates the fees
  /// then transfers the amount less fees to the To address, and the fee amount to the fee collector
  function _transferTokens(address to, address token0, address token1, uint256 amount0, uint256 amount1, uint256 feePercent) internal {
    if (amount0 > 0) {
      uint256 fee0 = _feeCalculation(amount0, feePercent);
      IERC20(token0).transfer(to, amount0 - fee0);
      IERC20(token0).transfer(_feeCollector, fee0);
    }
    if (amount1 > 0) {
       uint256 fee1 = _feeCalculation(amount1, feePercent);
      IERC20(token1).transfer(to, amount1 - fee1);
      IERC20(token1).transfer(_feeCollector, fee1);
    }
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
