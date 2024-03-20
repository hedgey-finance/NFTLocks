const deploy = require('../fixtures');
const { expect } = require('chai');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');


module.exports = () => {
    let deployed, admin, a, b, nft, nftLock;
    it('should deploy the contracts and mint two NFTs to wallet A, and lock the first nft with the lock method, and the second with the safeTransfer method', async () => {
        deployed = await deploy();
        admin = deployed.admin;
        a = deployed.a;
        b = deployed.b;
        nft = deployed.nft;
        nftLock = deployed.nftLock;
        await nft.mint(a.address, '1');
        await nft.mint(a.address, '2');
        await nft.connect(a).approve(nftLock.target, 1);
        let now = BigInt(await time.latest());
        const lock1 = {
            nft: nft.target,
            tokenId: '1',
            unlockDate: now + BigInt(100),
            transferable: true,
        };
        let tx = await nftLock.connect(a).lockNFT(a.address, lock1);
        

        let lock2 = {
            nft: nft.target,
            tokenId: 2,
            unlockDate: now + BigInt(500),
            transferable: false,
        };
        const abiCoder = new ethers.AbiCoder()
        let data = abiCoder.encode(['address', 'uint256', 'bool'], [b.address, lock2.unlockDate, lock2.transferable]);
        let tx2 = await nft.connect(a).transferWithData(nftLock.target, '2', data);
    })
}