const { ethers, run } = require('hardhat');
const { setTimeout } = require("timers/promises");

async function deploy(artifact, args) {
    const factory = await ethers.getContractFactory(artifact);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    // const contract = factory.attach('0x413Ae2AFC8f86044D10d04c103Df16B88Afc2Ba1');
    console.log(`New ${artifact} contract deployed at address: ${contract.target}`);
    await setTimeout(10000);
    await run("verify:verify", {
        address: contract.target,
        constructorArguments: args,
    });
}

const collector = '0xC606FD6f687c38Ec1056dd472dDf61a252e245c9';
const fee = BigInt(1000);
const maxFee = BigInt(5000);
const uniFactory = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

deploy('NFTLock', ['HedgeyV3LiquidityLocks', 'HVLL', collector, fee, maxFee, uniFactory]);