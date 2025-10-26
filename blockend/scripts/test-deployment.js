const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing contract deployment...");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");
  
  // Test creating a market
  const factoryAddress = process.env.FACTORY_ADDRESS;
  const managerAddress = process.env.MANAGER_ADDRESS;
  
  if (!factoryAddress || !managerAddress) {
    console.log("❌ Please set FACTORY_ADDRESS and MANAGER_ADDRESS environment variables");
    console.log("Example: FACTORY_ADDRESS=0x... MANAGER_ADDRESS=0x... node scripts/test-deployment.js");
    return;
  }
  
  console.log("Factory Address:", factoryAddress);
  console.log("Manager Address:", managerAddress);
  
  try {
    // Connect to deployed contracts
    const MarketFactory = await hre.ethers.getContractFactory("MarketFactory");
    const factory = MarketFactory.attach(factoryAddress);
    
    const MultiMarketManager = await hre.ethers.getContractFactory("MultiMarketManager");
    const manager = MultiMarketManager.attach(managerAddress);
    
    // Test factory functions
    console.log("\n🔍 Testing Factory functions...");
    const totalMarkets = await factory.getTotalMarkets();
    console.log("Total markets:", totalMarkets.toString());
    
    const totalVolume = await factory.getTotalVolume();
    console.log("Total volume:", hre.ethers.utils.formatEther(totalVolume), "ETH");
    
    // Test creating a market
    console.log("\n📦 Testing market creation...");
    const currentTime = Math.floor(Date.now() / 1000);
    const closingTime = currentTime + 3600; // 1 hour from now
    
    const tx = await factory.createMarket(
      "Test Market: Will this deployment work?",
      2, // 2 outcomes
      closingTime,
      { value: hre.ethers.utils.parseEther("0.01") }
    );
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // Check the new market
    const newTotalMarkets = await factory.getTotalMarkets();
    console.log("New total markets:", newTotalMarkets.toString());
    
    // Get the market address
    const marketId = newTotalMarkets.sub(1);
    const marketAddress = await factory.getMarket(marketId);
    console.log("New market address:", marketAddress);
    
    console.log("\n✅ All tests passed! Contracts are working correctly.");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

