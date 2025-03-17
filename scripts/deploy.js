const { ethers, run } = require('hardhat');
const { setTimeout } = require("timers/promises");

async function deploy(artifact, args) {
    const factory = await ethers.getContractFactory(artifact);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    // const contract = factory.attach('0x8Db081aA6Fbd29241292D28ce5C8dC75B6D83BC6');
    console.log(`New ${artifact} contract deployed at address: ${contract.target}`);
    await setTimeout(10000);
    await run("verify:verify", {
        address: contract.target,
        constructorArguments: args,
    });
}

const collector = '0x7883406fEf36D275B0C83ef83a5CBcb024196355';
const fee = BigInt(1000);
const maxFee = BigInt(5000);
const uniFactory = '0x33128a8fC17869897dcE68Ed026d694621f6FDfD'
const uinSepFactory = '0x0227628f3F023bb0B980b67D528571c95c6DaC1c'

deploy('NFTLock', ['HedgeyV3LiquidityLocks', 'HVLL', collector, fee, maxFee, uniFactory]);