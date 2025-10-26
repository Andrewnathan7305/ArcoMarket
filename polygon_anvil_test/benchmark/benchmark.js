const { ethers } = require('ethers');

const ANVIL_RPC = 'http://127.0.0.1:8545';
// ⚠️ UPDATE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS!
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const ABI = [
    "function simpleWrite(uint256 value)",
    "function multiWrite(uint256 value)",
    "function batchWrite(uint256[] values)",
    "function transfer(address to, uint256 amount)",
    "function deposit() payable",
    "function counter() view returns (uint256)",
    "function getBalance(address user) view returns (uint256)",
];

async function runBenchmark() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   ANVIL POLYGON FORK BENCHMARK         ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    const provider = new ethers.JsonRpcProvider(ANVIL_RPC);
    const signer = await provider.getSigner(0);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    console.log('📍 Network:', network.chainId);
    console.log('📦 Block:', blockNumber);
    console.log('📜 Contract:', CONTRACT_ADDRESS);
    console.log('👤 Signer:', await signer.getAddress());
    console.log('💰 Balance:', ethers.formatEther(await provider.getBalance(signer.address)), 'ETH\n');
    
    // Test 1: Simple Write Throughput
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST 1: Simple Write Throughput');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const iterations = 50;
    const startTime = Date.now();
    const gasResults = [];
    
    for (let i = 0; i < iterations; i++) {
        const tx = await contract.simpleWrite(i);
        const receipt = await tx.wait();
        gasResults.push(receipt.gasUsed);
        
        if ((i + 1) % 10 === 0) {
            process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
        }
    }
    
    const duration = (Date.now() - startTime) / 1000;
    const avgGas = gasResults.reduce((a, b) => a + b, 0n) / BigInt(iterations);
    const tps = iterations / duration;
    
    console.log(`\n  ✓ Completed: ${iterations} transactions`);
    console.log(`  ⏱️  Duration: ${duration.toFixed(2)}s`);
    console.log(`  🚀 TPS: ${tps.toFixed(2)}`);
    console.log(`  ⛽ Avg Gas: ${avgGas.toString()}`);
    
    // Test 2: Multi-User Concurrent
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔥 TEST 2: Multi-User Stress Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const concurrentTxs = 30;
    const startTime2 = Date.now();
    const promises = [];
    
    for (let i = 0; i < concurrentTxs; i++) {
        const signerIndex = i % 10;
        const currentSigner = await provider.getSigner(signerIndex);
        const contractWithSigner = contract.connect(currentSigner);
        
        promises.push(
            contractWithSigner.multiWrite(i)
                .then(tx => tx.wait())
                .catch(err => null)
        );
    }
    
    const results = await Promise.all(promises);
    const duration2 = (Date.now() - startTime2) / 1000;
    const successful = results.filter(r => r !== null).length;
    const totalGas = results
        .filter(r => r !== null)
        .reduce((sum, r) => sum + r.gasUsed, 0n);
    
    console.log(`  ✓ Successful: ${successful}/${concurrentTxs}`);
    console.log(`  ⏱️  Duration: ${duration2.toFixed(2)}s`);
    console.log(`  🚀 TPS: ${(successful / duration2).toFixed(2)}`);
    console.log(`  ⛽ Total Gas: ${totalGas.toString()}`);
    
    // Test 3: Batch Operations
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 TEST 3: Batch Performance');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const batchSizes = [10, 50, 100, 200];
    
    for (const size of batchSizes) {
        const values = Array.from({ length: size }, (_, i) => i);
        try {
            const tx = await contract.batchWrite(values);
            const receipt = await tx.wait();
            const gasPerItem = receipt.gasUsed / BigInt(size);
            
            console.log(`  Batch ${size}: ${receipt.gasUsed.toString()} gas (${gasPerItem.toString()}/item)`);
        } catch (err) {
            console.log(`  Batch ${size}: ❌ Failed`);
        }
    }
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║       ✅ BENCHMARK COMPLETE!           ║');
    console.log('╚════════════════════════════════════════╝\n');
}

runBenchmark().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
