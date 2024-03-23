const deploy = require('../fixtures');
const { expect } = require('chai');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');

const unlockTests = (params) => {
  let deployed, admin, a, b, nft, nftLock;
  it('unlocks an NFT after the unlock date has passed', async () => {
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
      transferable: true,
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
    await time.increase(lock.unlockDate);
    await nftLock.connect(a).unlockNFT(1);
    expect(await nft.ownerOf(1)).to.eq(a.address);
    await expect(nftLock.ownerOf(1)).to.be.reverted;
    lockInfo = await nftLock.locks(1);
    expect(lockInfo.nft).to.eq(ethers.ZeroAddress);
    expect(lockInfo.tokenId).to.eq(0);
    expect(lockInfo.unlockDate).to.eq(0);
    expect(lockInfo.transferable).to.eq(false);
  });
  it('extends the unlock date of an NFT and then unlocks it', async () => {
    let now = BigInt(await time.latest());
    let lock = {
      nft: nft.target,
      tokenId: '1',
      unlockDate: now + BigInt(100),
      transferable: true,
    };
    await nft.connect(a).approve(nftLock.target, 1);
    await nftLock.connect(a).lockNFT(a.address, lock);
    lock.unlockDate = now + BigInt(200);
    await nftLock.connect(a).extendLock(2, lock.unlockDate);
    await time.increase(lock.unlockDate);
    let tx = await nftLock.connect(a).unlockNFT(2);
    expect(tx).to.emit(nftLock, 'NFTUnlocked').withArgs(2, 1);
    let lockInfo = await nftLock.locks(2);
    expect(lockInfo.unlockDate).to.eq(0);
    expect(lockInfo.tokenId).to.eq(0);
    expect(lockInfo.nft).to.eq(ethers.ZeroAddress);
    expect(lockInfo.transferable).to.eq(false);
    expect(await nft.ownerOf(1)).to.eq(a.address);
  });
  it('unlocks an NFT that has been transferred to it from another address', async () => {
    let now = BigInt(await time.latest());
    let lock = {
      nft: nft.target,
      tokenId: '2',
      unlockDate: now + BigInt(100),
      transferable: true,
    };
    await nft.mint(admin.address, 2);
    await nft.approve(nftLock.target, 2);
    await nftLock.lockNFT(a.address, lock);
    await nftLock.connect(a).transferFrom(a.address, b.address, 3);
    await time.increase(lock.unlockDate);
    expect(await nftLock.ownerOf(3)).to.eq(b.address);
    await nftLock.connect(b).unlockNFT(3);
    expect(await nft.ownerOf(2)).to.eq(b.address);
    await expect(nftLock.ownerOf(3)).to.be.reverted;
    let lockInfo = await nftLock.locks(3);
    expect(lockInfo.nft).to.eq(ethers.ZeroAddress);
    expect(lockInfo.tokenId).to.eq(0);
    expect(lockInfo.unlockDate).to.eq(0);
    expect(lockInfo.transferable).to.eq(false);
  });
};

const unlockErrorTests = (params) => {
  let deployed, admin, a, b, nft, nftLock;
  it('cant unlock if the unlock time is in the future', async () => {
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
      transferable: true,
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
    await expect(nftLock.connect(a).unlockNFT(1)).to.be.revertedWith('locked');
  });
  it('cant unlock if it is not the owner of the lock', async () => {
    await expect(nftLock.connect(b).unlockNFT(1)).to.be.revertedWith('!owner');
  });
  it('reverts if the lock token ID doesnt exist', async () => {
    await expect(nftLock.connect(a).unlockNFT(2)).to.be.reverted;
  });
  it('reverts if the locked NFT has already been unlocked', async () => {
    await time.increase(100);
    await nftLock.connect(a).unlockNFT(1);
    await expect(nftLock.connect(a).unlockNFT(1)).to.be.reverted;
  });
};

module.exports = {
  unlockTests,
  unlockErrorTests,
};
