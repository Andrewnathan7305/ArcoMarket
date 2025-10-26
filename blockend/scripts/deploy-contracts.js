const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts to Arcology localnet...");
  console.log("Network:", hre.network.name);
  console.log("RPC URL:", hre.network.config.url);
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");
  
  if (balance.lt(hre.ethers.utils.parseEther("0.1"))) {
    console.log("⚠️  Warning: Low balance, transactions might fail");
  }

  try {
    // Deploy MarketFactory
    console.log("\n📦 Deploying MarketFactory...");
    const MarketFactory = await hre.ethers.getContractFactory("MarketFactory");
    const factory = await MarketFactory.deploy(
      hre.ethers.utils.parseEther("0.01") // minimum deposit
    );
    await factory.deployed();
    console.log("✅ MarketFactory deployed to:", factory.address);

    // Deploy MultiMarketManager
    console.log("\n📦 Deploying MultiMarketManager...");
    const MultiMarketManager = await hre.ethers.getContractFactory("MultiMarketManager");
    const manager = await MultiMarketManager.deploy(factory.address);
    await manager.deployed();
    console.log("✅ MultiMarketManager deployed to:", manager.address);

    // Verify deployments
    console.log("\n🔍 Verifying deployments...");
    
    // Test factory functions
    const totalMarkets = await factory.getTotalMarkets();
    console.log("Factory total markets:", totalMarkets.toString());
    
    const totalVolume = await factory.getTotalVolume();
    console.log("Factory total volume:", hre.ethers.utils.formatEther(totalVolume), "ETH");

    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("=" * 50);
    console.log("Factory Address:", factory.address);
    console.log("Manager Address:", manager.address);
    console.log("=" * 50);
    
    console.log("\n📝 Next steps:");
    console.log("1. Update app/config/network.ts with these addresses:");
    console.log(`   MARKET_FACTORY: '${factory.address}',`);
    console.log(`   MANAGER: '${manager.address}'`);
    console.log("2. Restart your Next.js development server");
    console.log("3. Test the contracts in the dashboard");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

