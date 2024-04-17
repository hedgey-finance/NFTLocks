const { ethers, run } = require('hardhat');
const { setTimeout } = require("timers/promises");

async function deploy(artifact, args) {
    const factory = await ethers.getContractFactory(artifact);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    console.log(`New ${artifact} contract deployed at address: ${contract.target}`);
    await setTimeout(10000);
    await run("verify:verify", {
        address: contract.target,
        constructorArguments: args,
    });
}

const collector = '0xF610d3978161347c174d007950C2D477C660aa79';
const fee = BigInt(5000);

deploy('NFTLock', ['HedgeyV3LiquidityLocks', 'HVLL', collector, fee]);