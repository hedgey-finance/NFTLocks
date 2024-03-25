# NFT Locks    

This repository holds the contract for locking NFT for a specific time in the future, when the recipient of the lock can unlock the NFT and have it delivered to its wallet. 
The NFT that is locked is held in the NFTLock escrow contract, which itself is an ERC721Enumerable NFT contract - minting the recipient an NFT that tracks their locked position. 
In addition to unlocking, the recipient can extend the duration of the lockup. 

The purpose of this contract is to facilitate locking up UniswapV3 and other similar discrete liquidity AMMs positions.  
Transparency is key for new projects launching, and one of the most core functions is to provide the community the transparency and comfort that the liquidity a team / DAO has provided to a DEX is locked and cannot be pulled out before a specific unlock date. 

The Locks can be made transferable or not transferable, and support a single unlock timestamp.  

An NFTLock position can be created in one of two methods, either by approving the transfer of the NFT by the contract, and then calling the lockNFT function which will pull the UniNFT into the escrow contract and mint the recipient an NFT to mark their lock position.  
Or the sender can use the safeTransferFrom method and input the unlockTime and beneficiary address into the data field that will lock the UniNVT upon receipt, and in turn mint the beneficiary their lockNFT. 


## Testing

Clone repistory

``` bash
npm install
npx hardhat compile
npx hardhat test
```

## Deployment
To deploy the NFTLock contract, create a .env file in the main directory with your private key(s), network RPCs and etherscan API keys. Update the ./scripts/deploy.js file with the information required by the constructor arguments (name and symbol), and then you can use hardhat to deploy and verify the contract using the command: 

``` bash
npx hardhat run scripts/deploy.js --network <network-name>
```

## Testnet Deployments
NFTLock: `0x4B916fC53bc8aB7F592a5ec0B28687099ce7f42B`   
       

## Mainnet Deployments