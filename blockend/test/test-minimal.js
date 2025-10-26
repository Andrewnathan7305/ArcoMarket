const hre = require("hardhat");
var frontendUtil = require('@arcologynetwork/frontend-util/utils/util');

async function main() {
    const accounts = await ethers.getSigners();
    console.log(`Testing MINIMAL parallel contract`);
    
    // Deploy minimal market
    const MinimalMarket = await ethers.getContractFactory("MinimalMarket");
    const market = await MinimalMarket.deploy();
    await market.deployed();
    console.log(`✅ Minimal Market: ${market.address}`);
    
    // Test: 5 users place bets in parallel
    console.log('\nTest: 5 users bet in parallel (only incrementing counter)');
    const txs = [];
    
    for (let i = 1; i <= 5; i++) {
        txs.push(frontendUtil.generateTx(function([market, bettor]) {
            return market.connect(bettor).placeBet({ value: ethers.utils.parseEther("0.01") });
        }, market, accounts[i]));
    }
    
    await frontendUtil.waitingTxs(txs);
    console.log('✅ Parallel bets completed');
    
    const totalBets = await market.callStatic.getTotalBets();
    console.log(`   Total bets: ${totalBets}`);
    
    if (Number(totalBets) === 5) {
        console.log('\n🎉 SUCCESS: Parallel execution works with just U256Cumulative counter!');
        console.log('   Problem is with AddressU256CumMap.set() operations');
    } else {
        console.log(`\n❌ FAILED: Even basic U256Cumulative.add() doesn't work in parallel`);
        console.log('   This indicates a deeper issue with the test setup or blockchain');
    }
}

main().catch((error) => {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    process.exitCode = 1;
});

