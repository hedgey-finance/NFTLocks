const deploy = require('../fixtures');
const { expect } = require('chai');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');

const lockTests = () => {
  let deployed, admin, a, b, nft, nftLock;
  it('locks an NFT with the approve & transferFrom flow', async () => {
    deployed = await deploy();
    admin = deployed.admin;
    a = deployed.a;
    b = deployed.b;
    nft = deployed.nft;
    nftLock = deployed.nftLock;
    await nft.mint(admin.address, 1);
    await nft.approve(nftLock.target, 1);
    let now = BigInt(await time.latest());
    const lock = {
      nft: nft.target,
      tokenId: '1',
      unlockDate: now + BigInt(100),
      transferable: false,
    };
    expect(await nftLock.currentLockId()).to.eq(0);
    let tx = await nftLock.lockNFT(a.address, lock);
    expect(await nftLock.currentLockId()).to.eq(1);
    expect(tx).to.emit(nftLock, 'NFTLocked').withArgs(1, a.address, lock);
    expect(tx).to.emit(nft, 'Transfer').withArgs(admin.address, nftLock.target, 1);
    expect(await nft.ownerOf(1)).to.eq(nftLock.target);
    expect(await nftLock.ownerOf(1)).to.eq(a.address);
    let lockInfo = await nftLock.locks(1);
    expect(lockInfo.nft).to.eq(lock.nft);
    expect(lockInfo.tokenId).to.eq(lock.tokenId);
    expect(lockInfo.unlockDate).to.eq(lock.unlockDate);
    expect(lockInfo.transferable).to.eq(lock.transferable);
  });
  it('locks an NFT with the transferWithData flow', async () => {
    await nft.mint(admin.address, 2);
    let now = BigInt(await time.latest());
    const lock = {
      nft: nft.target,
      tokenId: 2,
      unlockDate: now + BigInt(500),
      transferable: true,
    };
    expect(await nftLock.currentLockId()).to.eq(1);
    const abiCoder = new ethers.AbiCoder();
    let data = abiCoder.encode(['address', 'uint256', 'bool'], [b.address, lock.unlockDate, lock.transferable]);
    let tx = await nft.connect(admin).transferWithData(nftLock.target, '2', data);
    expect(await nftLock.currentLockId()).to.eq(2);
    expect(tx).to.emit(nftLock, 'NFTLocked').withArgs(2, b.address, lock);
    expect(tx).to.emit(nft, 'Transfer').withArgs(admin.address, nftLock.target, 2);
    expect(await nft.ownerOf(2)).to.eq(nftLock.target);
    expect(await nftLock.ownerOf(2)).to.eq(b.address);
    let lockInfo = await nftLock.locks(2);
    expect(lockInfo.nft).to.eq(lock.nft);
    expect(lockInfo.tokenId).to.eq(lock.tokenId);
    expect(lockInfo.unlockDate).to.eq(lock.unlockDate);
    expect(lockInfo.transferable).to.eq(lock.transferable);
  });
  it('extends the duration lock of an NFT that was minted to it', async () => {
    // it will extend the lock of NFT number 1 by 100 seconds
    let extendedUnlockTime = (await nftLock.locks(1)).unlockDate + BigInt(100);
    let tx = await nftLock.connect(a).extendLock(1, extendedUnlockTime);
    expect(tx).to.emit(nftLock, 'LockExtended').withArgs(1, extendedUnlockTime);
    expect((await nftLock.locks(1)).unlockDate).to.eq(extendedUnlockTime);
    expect(await nftLock.ownerOf(1)).to.eq(a.address);
    expect(await nft.ownerOf(1)).to.eq(nftLock.target);
  });
  it('extends the duration lock of an NFT that was transferred to it', async () => {
    // it will extend the lock of NFT number 2 by 100 seconds
    let extendedUnlockTime = (await nftLock.locks(2)).unlockDate + BigInt(100);
    let tx = await nftLock.connect(b).extendLock(2, extendedUnlockTime);
    expect(tx).to.emit(nftLock, 'LockExtended').withArgs(2, extendedUnlockTime);
    expect((await nftLock.locks(2)).unlockDate).to.eq(extendedUnlockTime);
    expect(await nftLock.ownerOf(2)).to.eq(b.address);
    expect(await nft.ownerOf(2)).to.eq(nftLock.target);
    await nftLock.connect(b).transferFrom(b.address, a.address, 2);
    expect(await nftLock.ownerOf(2)).to.eq(a.address);
    expect(await nft.ownerOf(2)).to.eq(nftLock.target);
    extendedUnlockTime = extendedUnlockTime + BigInt(100);
    tx = await nftLock.connect(a).extendLock(2, extendedUnlockTime);
    expect(tx).to.emit(nftLock, 'LockExtended').withArgs(2, extendedUnlockTime);
    expect((await nftLock.locks(2)).unlockDate).to.eq(extendedUnlockTime);
    expect(await nftLock.ownerOf(2)).to.eq(a.address);
    expect(await nft.ownerOf(2)).to.eq(nftLock.target);
  });
  it('locks an NFT with the recipient as 0 address which defaults to the caller as the recipient', async () => {
    await nft.mint(admin.address, 3);
    let now = BigInt(await time.latest());
    const lock = {
      nft: nft.target,
      tokenId: 3,
      unlockDate: now + BigInt(100),
      transferable: false,
    };
    let tx = await nft.approve(nftLock.target, 3);
    tx = await nftLock.lockNFT(ethers.ZeroAddress, lock);
    expect(await nftLock.ownerOf(3)).to.eq(admin.address);
  });
  it('locks an NFT with the recipient as the 0 address using the transferWithData flow', async () => {
    await nft.mint(admin.address, 4);
    let now = BigInt(await time.latest());
    const lock = {
      nft: nft.target,
      tokenId: 4,
      unlockDate: now + BigInt(100),
      transferable: false,
    };
    const abiCoder = new ethers.AbiCoder();
    let data = abiCoder.encode(['address', 'uint256', 'bool'], [ethers.ZeroAddress, lock.unlockDate, lock.transferable]);
    let tx = await nft.connect(admin).transferWithData(nftLock.target, '4', data);
    expect(await nftLock.ownerOf(4)).to.eq(admin.address);
  });
};

const lockErrorTests = () => {
  let deployed, admin, a, b, nft, nftLock, lock;
  it('reverts if a user tries to lock an NFT they do not own', async () => {
    deployed = await deploy();
    admin = deployed.admin;
    a = deployed.a;
    b = deployed.b;
    nft = deployed.nft;
    nftLock = deployed.nftLock;
    await nft.mint(admin.address, 1);
    await nft.approve(nftLock.target, 1);
    let now = BigInt(await time.latest());
    lock = {
        nft: nft.target,
        tokenId: 1,
        unlockDate: now + BigInt(100),
        transferable: false,
    }
    await expect(
      nftLock
        .connect(b)
        .lockNFT(b.address, lock)
    ).to.be.reverted;
  });
  it('reverts if a user tries to lock an NFT that is already locked', async () => {
    await nft.approve(nftLock.target, 1);
    let now = BigInt(await time.latest());
    await nftLock.lockNFT(a.address, lock);
    await expect(
      nftLock
        .connect(a)
        .lockNFT(a.address, lock)
    ).to.be.reverted;
  });
  it('reverts if the NFT to lock is not approved for transfer', async () => {
    await nft.mint(admin.address, 2);
    let now = BigInt(await time.latest());
    lock = {
        nft: nft.target,
        tokenId: 2,
        unlockDate: now + BigInt(100),
        transferable: false,
    }
    await expect(
      nftLock
        .connect(admin)
        .lockNFT(a.address, lock)
    ).to.be.reverted;
  });
  it('reverts if the NFT contract address of the lock object is the 0 address', async () => {
    await nft.mint(admin.address, 3);
    let now = BigInt(await time.latest());
    lock = {
        nft: ethers.ZeroAddress,
        tokenId: 3,
        unlockDate: now + BigInt(100),
        transferable: false,
    }
    await expect(
      nftLock
        .connect(admin)
        .lockNFT(a.address, lock)
    ).to.be.revertedWith('!nftaddress');
  });
  it('reverts if it does not own the NFT using the transferWithData flow', async () => {
    await nft.mint(admin.address, 4);
    let now = BigInt(await time.latest());
    const lock = {
      nft: nft.target,
      tokenId: 4,
      unlockDate: now + BigInt(100),
      transferable: true,
    };
    const abiCoder = new ethers.AbiCoder();
    let data = abiCoder.encode(['address', 'uint256', 'bool'], [b.address, lock.unlockDate, lock.transferable]);
    await expect(
      nft.connect(a).transferWithData(nftLock.target, '4', data)
    ).to.be.reverted;
  });
};

module.exports = {
  lockTests,
  lockErrorTests,
};
