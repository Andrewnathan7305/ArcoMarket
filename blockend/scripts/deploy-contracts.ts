import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying contracts to Arcology localnet...");
  console.log("Network:", ethers.provider.network.name);
  console.log("RPC URL:", ethers.provider.connection.url);
  console.log("");

  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
  console.log("");

  try {
    // Deploy MarketFactory
    console.log("📦 Deploying MarketFactory...");
    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    const factory = await MarketFactory.deploy(ethers.utils.parseEther("0.01"));
    await factory.deployed();
    console.log("✅ MarketFactory deployed to:", factory.address);

    // Deploy MultiMarketManager
    console.log("📦 Deploying MultiMarketManager...");
    const MultiMarketManager = await ethers.getContractFactory("MultiMarketManager");
    const manager = await MultiMarketManager.deploy(factory.address);
    await manager.deployed();
    console.log("✅ MultiMarketManager deployed to:", manager.address);

    // Deploy Subcurrency (Coin)
    console.log("📦 Deploying Subcurrency (Coin)...");
    const Subcurrency = await ethers.getContractFactory("Coin");
    const coin = await Subcurrency.deploy();
    await coin.deployed();
    console.log("✅ Subcurrency deployed to:", coin.address);

    // Deploy ParallelSubcurrency
    console.log("📦 Deploying ParallelSubcurrency...");
    const ParallelSubcurrency = await ethers.getContractFactory("ParallelCoin");
    const parallelCoin = await ParallelSubcurrency.deploy();
    await parallelCoin.deployed();
    console.log("✅ ParallelSubcurrency deployed to:", parallelCoin.address);

    // Deploy ParallelLike
    console.log("📦 Deploying ParallelLike...");
    const ParallelLike = await ethers.getContractFactory("Like");
    const like = await ParallelLike.deploy();
    await like.deployed();
    console.log("✅ ParallelLike deployed to:", like.address);

    // Deploy ParallelBoolArray
    console.log("📦 Deploying ParallelBoolArray...");
    const ParallelBoolArray = await ethers.getContractFactory("BoolArray");
    const boolArray = await ParallelBoolArray.deploy();
    await boolArray.deployed();
    console.log("✅ ParallelBoolArray deployed to:", boolArray.address);

    // Deploy MyMultiProcess
    console.log("📦 Deploying MyMultiProcess...");
    const MyMultiProcess = await ethers.getContractFactory("MyMultiProcess");
    const multiProcess = await MyMultiProcess.deploy();
    await multiProcess.deployed();
    console.log("✅ MyMultiProcess deployed to:", multiProcess.address);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("");
    console.log("📋 Contract Addresses:");
    console.log("MarketFactory:", factory.address);
    console.log("MultiMarketManager:", manager.address);
    console.log("Subcurrency (Coin):", coin.address);
    console.log("ParallelSubcurrency:", parallelCoin.address);
    console.log("ParallelLike:", like.address);
    console.log("ParallelBoolArray:", boolArray.address);
    console.log("MyMultiProcess:", multiProcess.address);
    console.log("");
    console.log("📝 Next steps:");
    console.log("1. Copy the contract addresses above");
    console.log("2. Update app/config/network.ts with the new addresses");
    console.log("3. Restart your Next.js server: npm run dev");
    console.log("");
    console.log("🔗 Frontend config file: frontend/app/config/network.ts");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });