// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MarketFactory.sol";
import "../src/MinimalMarket.sol";

contract DeployAll is Script {
    function run() external {
        vm.startBroadcast();
        
        console.log("  DEPLOYING ALL CONTRACTS              ");
        
        // Deploy MinimalMarket
        MinimalMarket minimalMarket = new MinimalMarket();
        console.log("MinimalMarket:", address(minimalMarket));
        
        // Deploy MarketFactory
        uint256 minimumDeposit = 0.1 ether;
        MarketFactory factory = new MarketFactory(minimumDeposit);
        console.log("MarketFactory:", address(factory));
        
        console.log(" Deployment Complete!");
        
        vm.stopBroadcast();
    }
}
