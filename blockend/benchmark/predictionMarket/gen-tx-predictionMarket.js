const hre = require("hardhat");
var frontendUtil = require('@arcologynetwork/frontend-util/utils/util');
const nets = require('../../network.json');
const ProgressBar = require('progress');

async function main() {
    accounts = await ethers.getSigners();
    const provider = new ethers.providers.JsonRpcProvider(nets[hre.network.name].url);
    const pkCreator = nets[hre.network.name].accounts[0];
    const signerCreator = new ethers.Wallet(pkCreator, provider);
    const txbase = 'benchmark/predictionMarket/txs';
    frontendUtil.ensurePath(txbase);

    let i, tx;

    console.log('======= DEPLOYING CONTRACTS =======');
    
    // Deploy MarketFactory
    const factory_contract = await ethers.getContractFactory("MarketFactory");
    const factory = await factory_contract.deploy(ethers.utils.parseEther("0.01"));
    await factory.deployed();
    console.log(`✅ MarketFactory deployed at ${factory.address}`);

    // Deploy MultiMarketManager
    const manager_contract = await ethers.getContractFactory("MultiMarketManager");
    const manager = await manager_contract.deploy(factory.address);
    await manager.deployed();
    console.log(`✅ MultiMarketManager deployed at ${manager.address}`);

    // Create a market for benchmarking
    console.log('\n======= CREATING MARKET =======');
    const currentTime = Math.floor(Date.now() / 1000);
    const closingTime = currentTime + 86400; // 24 hours
    
    tx = await factory.connect(signerCreator).createMarket(
        "Benchmark Market: Which outcome will win?",
        3,  // 3 outcomes
        closingTime,
        { value: ethers.utils.parseEther("0.1"), gasLimit: 5000000 }
    );
    await tx.wait();
    
    const marketAddr = await factory.callStatic.getMarket(0);
    console.log(`✅ Market created at ${marketAddr}`);

    const Market = await ethers.getContractFactory("Market");
    const market = Market.attach(marketAddr);

    // ============================================================================
    // BENCHMARK 1: Parallel Betting
    // ============================================================================
    
    console.log('\n======= GENERATING BETTING TRANSACTIONS =======');
    let accountsLength = Math.min(accounts.length, 100000); // Limit to 10k for benchmark
    
    frontendUtil.ensurePath(txbase + '/placeBet');
    const handle_bet = frontendUtil.newFile(txbase + '/placeBet/placeBet.out');

    const betBar = new ProgressBar('Generating bet txs [:bar] :percent :etas', {
        total: 100,
        width: 40,
        complete: '█',
        incomplete: ' ',
    });

    const betPercent = accountsLength / 100;
    let pk, signer;
    
    for (i = 0; i < accountsLength; i++) {
        pk = nets[hre.network.name].accounts[i];
        signer = new ethers.Wallet(pk, provider);
        
        const outcome = i % 3; // Distribute across 3 outcomes
        
        // Generate placeBet transaction
        tx = await market.connect(accounts[i]).populateTransaction.placeBet(outcome, {
            value: ethers.utils.parseEther("0.01"),
            gasLimit: 100000
        });
        
        await frontendUtil.writePreSignedTxFile(handle_bet, signer, tx);
        
        if (i > 0 && i % betPercent == 0) {
            betBar.tick(1);
        }
    }
    betBar.tick(1);

    if (betBar.complete) {
        console.log(`✅ Bet tx generation completed: ${accountsLength} transactions`);
    }

    // ============================================================================
    // BENCHMARK 2: Market Resolution & Disputes
    // ============================================================================
    
    console.log('\n======= GENERATING DISPUTE TRANSACTIONS =======');
    
    // Close and resolve market first (for dispute benchmark setup)
    tx = await market.connect(signerCreator).closeMarket();
    await tx.wait();
    
    tx = await market.connect(signerCreator).resolveMarket(1); // Resolve to outcome 1
    await tx.wait();
    console.log('✅ Market resolved (outcome 1)');

    const disputeCount = Math.min(accountsLength, 1000); // 1k disputes
    frontendUtil.ensurePath(txbase + '/dispute');
    const handle_dispute = frontendUtil.newFile(txbase + '/dispute/dispute.out');

    const disputeBar = new ProgressBar('Generating dispute txs [:bar] :percent :etas', {
        total: 100,
        width: 40,
        complete: '█',
        incomplete: ' ',
    });

    const disputePercent = disputeCount / 100;
    
    for (i = 0; i < disputeCount; i++) {
        pk = nets[hre.network.name].accounts[i];
        signer = new ethers.Wallet(pk, provider);
        
        const proposedOutcome = 0; // Dispute to outcome 0
        
        // Generate disputeResolution transaction
        tx = await market.connect(accounts[i]).populateTransaction.disputeResolution(proposedOutcome, {
            value: ethers.utils.parseEther("0.1"), // 0.1 ETH stake
            gasLimit: 100000
        });
        
        await frontendUtil.writePreSignedTxFile(handle_dispute, signer, tx);
        
        if (i > 0 && i % disputePercent == 0) {
            disputeBar.tick(1);
        }
    }
    disputeBar.tick(1);

    if (disputeBar.complete) {
        console.log(`✅ Dispute tx generation completed: ${disputeCount} transactions`);
    }

    // ============================================================================
    // BENCHMARK 3: Batch Betting (Multi-Market)
    // ============================================================================
    
    console.log('\n======= GENERATING BATCH BET TRANSACTIONS =======');
    
    // Create 2 more markets for batch betting
    for (let m = 1; m <= 2; m++) {
        tx = await factory.connect(signerCreator).createMarket(
            `Batch Market ${m}`,
            2,
            closingTime,
            { value: ethers.utils.parseEther("0.1"), gasLimit: 5000000 }
        );
        await tx.wait();
    }
    console.log('✅ Created 2 additional markets for batch betting');

    const batchCount = Math.min(accountsLength / 2, 1000); // 1k batch bets
    frontendUtil.ensurePath(txbase + '/batchBet');
    const handle_batch = frontendUtil.newFile(txbase + '/batchBet/batchBet.out');

    const batchBar = new ProgressBar('Generating batch bet txs [:bar] :percent :etas', {
        total: 100,
        width: 40,
        complete: '█',
        incomplete: ' ',
    });

    const batchPercent = batchCount / 100;
    
    for (i = 0; i < batchCount; i++) {
        pk = nets[hre.network.name].accounts[i];
        signer = new ethers.Wallet(pk, provider);
        
        const marketIds = [0, 1, 2]; // All 3 markets
        const outcomes = [i % 3, i % 2, (i + 1) % 2]; // Different outcomes
        const amounts = [
            ethers.utils.parseEther("0.01"),
            ethers.utils.parseEther("0.01"),
            ethers.utils.parseEther("0.01")
        ];
        
        // Generate batchBet transaction
        tx = await manager.connect(accounts[i]).populateTransaction.batchBet(
            marketIds,
            outcomes,
            amounts,
            {
                value: ethers.utils.parseEther("0.03"),
                gasLimit: 500000
            }
        );
        
        await frontendUtil.writePreSignedTxFile(handle_batch, signer, tx);
        
        if (i > 0 && i % batchPercent == 0) {
            batchBar.tick(1);
        }
    }
    batchBar.tick(1);

    if (batchBar.complete) {
        console.log(`✅ Batch bet tx generation completed: ${batchCount} transactions`);
    }

    // ============================================================================
    // BENCHMARK 4: Parlay Creation
    // ============================================================================
    
    console.log('\n======= GENERATING PARLAY TRANSACTIONS =======');
    
    const parlayCount = Math.min(accountsLength / 3, 500); // 500 parlays
    frontendUtil.ensurePath(txbase + '/parlay');
    const handle_parlay = frontendUtil.newFile(txbase + '/parlay/parlay.out');

    const parlayBar = new ProgressBar('Generating parlay txs [:bar] :percent :etas', {
        total: 100,
        width: 40,
        complete: '█',
        incomplete: ' ',
    });

    const parlayPercent = parlayCount / 100;
    
    for (i = 0; i < parlayCount; i++) {
        pk = nets[hre.network.name].accounts[i];
        signer = new ethers.Wallet(pk, provider);
        
        const marketIds = [0, 1, 2]; // All 3 markets
        const outcomes = [i % 3, i % 2, (i + 1) % 2]; // Different combinations
        
        // Generate createParlay transaction
        tx = await manager.connect(accounts[i]).populateTransaction.createParlay(
            marketIds,
            outcomes,
            {
                value: ethers.utils.parseEther("0.3"),
                gasLimit: 500000
            }
        );
        
        await frontendUtil.writePreSignedTxFile(handle_parlay, signer, tx);
        
        if (i > 0 && i % parlayPercent == 0) {
            parlayBar.tick(1);
        }
    }
    parlayBar.tick(1);

    if (parlayBar.complete) {
        console.log(`✅ Parlay tx generation completed: ${parlayCount} transactions`);
    }

    // ============================================================================
    // Summary
    // ============================================================================
    
    console.log('\n======= BENCHMARK GENERATION COMPLETE =======');
    console.log(`📊 Transaction Summary:`);
    console.log(`   Betting transactions: ${accountsLength}`);
    console.log(`   Dispute transactions: ${disputeCount}`);
    console.log(`   Batch bet transactions: ${batchCount}`);
    console.log(`   Parlay transactions: ${parlayCount}`);
    console.log(`   Total: ${accountsLength + disputeCount + batchCount + parlayCount}`);
    console.log(`\n📁 Transactions saved to: ${txbase}/`);
    console.log(`\n✅ Ready for parallel execution stress test!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


