const deploy = require('../fixtures');
const { expect } = require('chai');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');

const transferTests = () => {
    let deployed, admin, a, b, nft, nftLock;
    it('transfers an NFT with the transferFrom flow', async () => {
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
        await nftLock.connect(a).transferFrom(a.address, b.address, 1);
        expect(await nftLock.ownerOf(1)).to.eq(b.address);
    });
    it('transfers the NFT with the safeTransfer function', async () => {
        let tx = await nftLock.connect(b).safeTransferFrom(b.address, a.address, 1);
        expect(await nftLock.ownerOf(1)).to.eq(a.address);
    });
    it('transfers the NFT approving it first and letting an approved address transfer it', async () => {
        await nftLock.connect(a).approve(b.address, 1);
        await nftLock.connect(b).transferFrom(a.address, b.address, 1);
        expect(await nftLock.ownerOf(1)).to.eq(b.address);
    });
    it('transfers the NFT by approving a spender operator and then transfering the NFT', async () => {
        await nftLock.connect(b).setApprovalForAll(admin.address, true);
        await nftLock.connect(admin).transferFrom(b.address, a.address, 1);
        expect(await nftLock.ownerOf(1)).to.eq(a.address);
    });
}

const transferErrorTests = () => {
    let deployed, admin, a, b, nft, nftLock;
    it('fails to transfer an NFT that is not transferable', async () => {
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
        await expect(nftLock.connect(a).transferFrom(a.address, b.address, 1)).to.be.revertedWith('!transferable');
    });
    it('reverts when trying to transfer an non transferable NFT using safeTransferFrom', async () => {
        await expect(nftLock.connect(b).safeTransferFrom(b.address, a.address, 1)).to.be.revertedWith('!transferable');
    });
    it('fails to transfer an NFT that is not owned by the sender', async () => {
        await nft.mint(admin.address, 2);
        await nft.approve(nftLock.target, 2);
        let now = BigInt(await time.latest());
        const lock = {
            nft: nft.target,
            tokenId: '2',
            unlockDate: now + BigInt(100),
            transferable: true,
        };
        let tx = await nftLock.lockNFT(a.address, lock);
        await expect(nftLock.connect(b).transferFrom(b.address, a.address, 2)).to.be.reverted;
        await expect(nftLock.connect(b).transferFrom(a.address, b.address, 2)).to.be.reverted;
    });
}

module.exports = {
    transferTests,
    transferErrorTests,
};
