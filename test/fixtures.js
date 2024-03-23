const { ethers } = require('hardhat');

module.exports = async () => {
    const [admin, a, b] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory('NFT');
    const NFTLock = await ethers.getContractFactory('NFTLock');
    const nft = await NFT.deploy('URI/');
    const nftLock = await NFTLock.deploy('NFTLock', 'NFTL');
    await nft.waitForDeployment();
    await nftLock.waitForDeployment();
    return {
        admin,
        a,
        b,
        nft,
        nftLock,
    };
}