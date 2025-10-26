import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ArcoMarketModule", (m) => {
  // Deploy MarketFactory
  const factory = m.contract("MarketFactory", [m.parseEther("0.01")]);

  // Deploy MultiMarketManager
  const manager = m.contract("MultiMarketManager", [factory]);

  // Deploy Subcurrency (Coin)
  const coin = m.contract("Coin");

  // Deploy ParallelSubcurrency
  const parallelCoin = m.contract("ParallelCoin");

  // Deploy ParallelLike
  const like = m.contract("Like");

  // Deploy ParallelBoolArray
  const boolArray = m.contract("BoolArray");

  // Deploy MyMultiProcess
  const multiProcess = m.contract("MyMultiProcess");

  return {
    factory,
    manager,
    coin,
    parallelCoin,
    like,
    boolArray,
    multiProcess,
  };
});
