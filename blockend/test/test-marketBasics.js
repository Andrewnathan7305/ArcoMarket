const hre = require("hardhat");
var frontendUtil = require('@arcologynetwork/frontend-util/utils/util');
const { expect } = require("chai");

async function main() {
    accounts = await ethers.getSigners();
    
    let tx, receipt;
    
    console.log('======= BASIC MARKET TEST =======\n');
    
    // Deploy factory
    console.log('Deploying MarketFactory...');
    const factory_contract = await ethers.getContractFactory("MarketFactory");
    const factory = await factory_contract.deploy(ethers.utils.parseEther("0.01"));
    await factory.deployed();
    console.log(`✅ Factory deployed at ${factory.address}`);
    
    // Create a market
    console.log('\nCreating a prediction market...');
    const currentTime = Math.floor(Date.now() / 1000);
    
    tx = await factory.createMarket(
        "Will Bitcoin reach $100k by 2025?",
        2,  // Yes/No
        currentTime + 3600,
        { value: ethers.utils.parseEther("0.05"), gasLimit: 5000000 }
    );
    await tx.wait();
    console.log('✅ Market created');
    
    // Get market address using callStatic
    const marketAddr = await factory.callStatic.getMarket(0);
    console.log(`Market address: ${marketAddr}`);
    
    const Market = await ethers.getContractFactory("Market");
    const market = Market.attach(marketAddr);
    
    // Test parallel betting with 5 users
    console.log('\nTesting parallel betting (5 users)...');
    const bettingTxs = [];
    
    for (let i = 1; i <= 5; i++) {
        const outcome = i % 2;  // Alternate between Yes/No
        
        bettingTxs.push(frontendUtil.generateTx(function([market, bettor, outcome]) {
            return market.connect(bettor).placeBet(outcome, { value: ethers.utils.parseEther("0.05") });
        }, market, accounts[i], outcome));
    }
    
    await frontendUtil.waitingTxs(bettingTxs);
    console.log('✅ 5 users placed bets');
    
    // Check results using callStatic
    const totalBets = await market.callStatic.getTotalBets();
    const totalVolume = await market.callStatic.getTotalVolume();
    const outcome0Pool = await market.callStatic.getOutcomePool(0);
    const outcome1Pool = await market.callStatic.getOutcomePool(1);
    
    console.log(`\n📊 Market Stats:`);
    console.log(`  Total bets: ${totalBets}`);
    console.log(`  Total volume: ${ethers.utils.formatEther(totalVolume)} ETH`);
    console.log(`  Outcome 0 pool: ${ethers.utils.formatEther(outcome0Pool)} ETH`);
    console.log(`  Outcome 1 pool: ${ethers.utils.formatEther(outcome1Pool)} ETH`);
    
    console.log('\n✅ Basic market test passed!');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
