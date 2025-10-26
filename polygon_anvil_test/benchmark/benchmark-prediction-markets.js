const { ethers } = require('ethers');

const ANVIL_RPC = 'http://127.0.0.1:8545';

// UPDATE THESE WITH YOUR DEPLOYED ADDRESSES!
const MINIMAL_MARKET_ADDRESS = '0x...';
const FACTORY_ADDRESS = '0x...';

const MINIMAL_MARKET_ABI = [
    "function placeBet() payable",
    "function getTotalBets() view returns (uint256)",
    "function getTotalVolume() view returns (uint256)",
];

const FACTORY_ABI = [
    "function createMarket(string question, uint256 numOutcomes, uint256 closingTime) payable returns (uint256)",
    "function getMarket(uint256 marketId) view returns (address)",
    "function getTotalMarkets() view returns (uint256)",
];

const MARKET_ABI = [
    "function placeBet(uint8 outcome) payable",
    "function getTotalBets() view returns (uint256)",
    "function getOutcomePool(uint8 outcome) view returns (uint256)",
    "function closeMarket()",
    "function resolveMarket(uint8 winningOutcome)",
];

async function runBenchmark() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     PREDICTION MARKET BENCHMARK SUITE                     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    const provider = new ethers.JsonRpcProvider(ANVIL_RPC);
    const signer = await provider.getSigner(0);
    
    console.log('📍 Network:', (await provider.getNetwork()).chainId.toString());
    console.log('📦 Block:', await provider.getBlockNumber());
    console.log('👤 Signer:', await signer.getAddress());
    console.log('💰 Balance:', ethers.formatEther(await provider.getBalance(signer.address)), 'ETH\n');
    
    // Test 1: MinimalMarket Throughput
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST 1: MinimalMarket Throughput');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const minimalMarket = new ethers.Contract(MINIMAL_MARKET_ADDRESS, MINIMAL_MARKET_ABI, signer);
    
    const iterations = 100;
    const startTime = Date.now();
    const gasResults = [];
    
    for (let i = 0; i < iterations; i++) {
        const tx = await minimalMarket.placeBet({ value: ethers.parseEther("0.01") });
        const receipt = await tx.wait();
        gasResults.push(receipt.gasUsed);
        
        if ((i + 1) % 20 === 0) {
            process.stdout.write(`\r   Progress: ${i + 1}/${iterations}`);
        }
    }
    
    const duration = (Date.now() - startTime) / 1000;
    const avgGas = gasResults.reduce((a, b) => a + b, 0n) / BigInt(iterations);
    const tps = iterations / duration;
    
    console.log(`\n   ✓ Completed: ${iterations} bets`);
    console.log(`   ⏱️  Duration: ${duration.toFixed(2)}s`);
    console.log(`   🚀 TPS: ${tps.toFixed(2)}`);
    console.log(`   ⛽ Avg Gas: ${avgGas.toString()}\n`);
    
    // Test 2: Market Creation
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏭 TEST 2: Market Creation Performance');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
    
    const marketCreations = 10;
    const creationGas = [];
    
    for (let i = 0; i < marketCreations; i++) {
        const tx = await factory.createMarket(
            `Test Market ${i}`,
            2,
            Math.floor(Date.now() / 1000) + 3600,
            { value: ethers.parseEther("0.1") }
        );
        const receipt = await tx.wait();
        creationGas.push(receipt.gasUsed);
    }
    
    const avgCreationGas = creationGas.reduce((a, b) => a + b, 0n) / BigInt(marketCreations);
    console.log(`   Markets Created: ${marketCreations}`);
    console.log(`   Avg Gas: ${avgCreationGas.toString()}\n`);
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              ✅ BENCHMARK COMPLETE!                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

runBenchmark().catch(console.error);
