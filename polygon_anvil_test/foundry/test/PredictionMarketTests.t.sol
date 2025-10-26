// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Market.sol";
import "../src/MarketFactory.sol";
import "../src/MinimalMarket.sol";

contract PredictionMarketTests is Test {
    MarketFactory public factory;
    Market public market;
    MinimalMarket public minimalMarket;
    
    address[] public users;
    uint256 constant NUM_USERS = 20;
    uint256 constant MINIMUM_DEPOSIT = 0.1 ether;
    
    function setUp() public {
      
        console.log("prediction market tests setup starting...");
        // Deploy factory
        factory = new MarketFactory(MINIMUM_DEPOSIT);
        console.log("Factory deployed at:", address(factory));
        
        // Deploy minimal market for simple tests
        minimalMarket = new MinimalMarket();
        console.log("MinimalMarket deployed at:", address(minimalMarket));
        
        // Create test users with balance
        for (uint256 i = 0; i < NUM_USERS; i++) {
            address user = address(uint160(i + 1000));
            users.push(user);
            vm.deal(user, 1000 ether);
        }
        
        console.log("Created", NUM_USERS, "test users\n");
    }
    
    // ═══════════════════════════════════════════════════════
    // MINIMAL MARKET TESTS
    // ═══════════════════════════════════════════════════════
    
    function test_MinimalMarket_Gas_PlaceBet() public {
        console.log("\n=== MINIMAL MARKET: Single Bet Gas ===");
        
        uint256 gasBefore = gasleft();
        minimalMarket.placeBet{value: 0.1 ether}();
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas Used:", gasUsed);
        
        assertEq(minimalMarket.getTotalBets(), 1);
        assertEq(minimalMarket.getTotalVolume(), 0.1 ether);
    }
    
    function test_MinimalMarket_Throughput() public {
        console.log("\n=== MINIMAL MARKET: Throughput Test ===");
        
        uint256 iterations = 100;
        uint256 totalGas = 0;
        
        for (uint256 i = 0; i < iterations; i++) {
            uint256 gasBefore = gasleft();
            minimalMarket.placeBet{value: 0.01 ether}();
            totalGas += gasBefore - gasleft();
        }
        
        console.log("Total Iterations:", iterations);
        console.log("Total Gas:", totalGas);
        console.log("Avg Gas per Bet:", totalGas / iterations);
        
        assertEq(minimalMarket.getTotalBets(), iterations);
    }
    
    function test_MinimalMarket_MultiUser() public {
        console.log("\n=== MINIMAL MARKET: Multi-User Test ===");
        
        uint256 betsPerUser = 10;
        uint256 totalGas = 0;
        
        for (uint256 i = 0; i < 10; i++) {
            address user = users[i];
            
            for (uint256 j = 0; j < betsPerUser; j++) {
                vm.startPrank(user);
                uint256 gasBefore = gasleft();
                minimalMarket.placeBet{value: 0.01 ether}();
                totalGas += gasBefore - gasleft();
                vm.stopPrank();
            }
        }
        
         uint256 totalBets = 10 * betsPerUser;
        console.log("Total Users:", uint256(10));
        console.log("Bets per User:", uint256(betsPerUser));
        console.log("Total Bets:", uint256(totalBets));
        console.log("Avg Gas per Bet:", uint256(totalGas / totalBets));
        
        assertEq(minimalMarket.getTotalBets(), totalBets);
    }
    
    // ═══════════════════════════════════════════════════════
    // MARKET FACTORY TESTS
    // ═══════════════════════════════════════════════════════
    
    function test_Factory_CreateMarket() public {
        console.log("\n=== FACTORY: Create Market Test ===");
        
        vm.startPrank(users[0]);
        
        uint256 gasBefore = gasleft();
        uint256 marketId = factory.createMarket{value: MINIMUM_DEPOSIT}(
            "Will BTC reach 100k?",
            2,
            block.timestamp + 1 days
        );
        uint256 gasUsed = gasBefore - gasleft();
        
        vm.stopPrank();
        
        console.log("Market ID:", marketId);
        console.log("Gas Used:", gasUsed);
        
        address marketAddr = factory.getMarket(marketId);
        console.log("Market Address:", marketAddr);
        
        assertTrue(marketAddr != address(0));
        assertEq(factory.getTotalMarkets(), 1);
    }
    
    function test_Factory_CreateMultipleMarkets() public {
        console.log("\n=== FACTORY: Multiple Market Creation ===");
        
        uint256 numMarkets = 10;
        uint256 totalGas = 0;
        
        for (uint256 i = 0; i < numMarkets; i++) {
            vm.startPrank(users[i]);
            
            uint256 gasBefore = gasleft();
            factory.createMarket{value: MINIMUM_DEPOSIT}(
                string(abi.encodePacked("Market ", vm.toString(i))),
                2,
                block.timestamp + 1 days
            );
            totalGas += gasBefore - gasleft();
            
            vm.stopPrank();
        }
        
        console.log("Markets Created:", numMarkets);
        console.log("Avg Gas per Market:", totalGas / numMarkets);
        
        assertEq(factory.getTotalMarkets(), numMarkets);
    }
    
    function test_Factory_StressTest() public {
        console.log("\n=== FACTORY: Stress Test ===");
        
        uint256 iterations = 50;
        uint256 totalGas = 0;
        
        for (uint256 i = 0; i < iterations; i++) {
            address creator = users[i % users.length];
            vm.startPrank(creator);
            
            uint256 gasBefore = gasleft();
            factory.createMarket{value: MINIMUM_DEPOSIT}(
                "Test Market",
                3,
                block.timestamp + 1 hours
            );
            totalGas += gasBefore - gasleft();
            
            vm.stopPrank();
        }
        
        console.log("Total Markets:", iterations);
        console.log("Avg Gas:", totalGas / iterations);
    }
    
    // ═══════════════════════════════════════════════════════
    // FULL MARKET TESTS
    // ═══════════════════════════════════════════════════════
    
    function test_Market_FullLifecycle() public {
        console.log("\n=== MARKET: Full Lifecycle Test ===");
        
        // 1. Create market
        vm.startPrank(users[0]);
        uint256 marketId = factory.createMarket{value: MINIMUM_DEPOSIT}(
            "Will ETH reach 5k?",
            2,
            block.timestamp + 1 hours
        );
        vm.stopPrank();
        
        address marketAddr = factory.getMarket(marketId);
        Market createdMarket = Market(payable(marketAddr));
        
        console.log("Market created:", marketAddr);
        
        // 2. Place bets
        uint256 totalBetGas = 0;
        for (uint256 i = 1; i <= 5; i++) {
            vm.startPrank(users[i]);
            uint256 gasBefore = gasleft();
            createdMarket.placeBet{value: 0.1 ether}(0);
            totalBetGas += gasBefore - gasleft();
            vm.stopPrank();
        }
        
        console.log("Placed 5 bets, Avg Gas:", totalBetGas / 5);
        
        // 3. Close market
        vm.warp(block.timestamp + 2 hours);
        vm.prank(users[0]);
        createdMarket.closeMarket();
        console.log("Market closed");
        
        // 4. Resolve market
        vm.prank(users[0]);
        createdMarket.resolveMarket(0);
        console.log("Market resolved");
        
        // 5. Finalize
        vm.warp(block.timestamp + 11 seconds);
        createdMarket.finalizeResolution();
        console.log("Market finalized");
        
        assertTrue(uint8(createdMarket.state()) == 3); // FINALIZED
    }
    
    function test_Market_PlaceBet_Gas() public {
        console.log("\n=== MARKET: Place Bet Gas Test ===");
        
        // Create market
        vm.prank(users[0]);
        uint256 marketId = factory.createMarket{value: MINIMUM_DEPOSIT}(
            "Test Market",
            3,
            block.timestamp + 1 days
        );
        
        Market createdMarket = Market(payable(factory.getMarket(marketId)));
        
        // Test bet gas
        vm.startPrank(users[1]);
        uint256 gasBefore = gasleft();
        createdMarket.placeBet{value: 1 ether}(0);
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();
        
        console.log("Place Bet Gas:", gasUsed);
        
        assertEq(createdMarket.getOutcomePool(0), 1 ether);
    }
    
    function test_Market_MultipleBets() public {
        console.log("\n=== MARKET: Multiple Bets Test ===");
        
        vm.prank(users[0]);
        uint256 marketId = factory.createMarket{value: MINIMUM_DEPOSIT}(
            "Test Market",
            3,
            block.timestamp + 1 days
        );
        
        Market createdMarket = Market(payable(factory.getMarket(marketId)));
        
        uint256 iterations = 50;
        uint256 totalGas = 0;
        
        for (uint256 i = 0; i < iterations; i++) {
            address user = users[i % 10];
            uint8 outcome = uint8(i % 3);
            
            vm.startPrank(user);
            uint256 gasBefore = gasleft();
            createdMarket.placeBet{value: 0.1 ether}(outcome);
            totalGas += gasBefore - gasleft();
            vm.stopPrank();
        }
        
        console.log("Total Bets:", iterations);
        console.log("Avg Gas per Bet:", totalGas / iterations);
        
        assertEq(createdMarket.getTotalBets(), iterations);
    }
    
    function test_Market_DisputeResolution() public {
        console.log("\n=== MARKET: Dispute Resolution Test ===");
        
        vm.prank(users[0]);
        uint256 marketId = factory.createMarket{value: MINIMUM_DEPOSIT}(
            "Test Market",
            2,
            block.timestamp + 1 hours
        );
        
        Market createdMarket = Market(payable(factory.getMarket(marketId)));
        
        // Place bets
        vm.prank(users[1]);
        createdMarket.placeBet{value: 1 ether}(0);
        
        // Close and resolve
        vm.warp(block.timestamp + 2 hours);
        vm.prank(users[0]);
        createdMarket.closeMarket();
        
        vm.prank(users[0]);
        createdMarket.resolveMarket(0);
        
        // Dispute
        vm.startPrank(users[2]);
        uint256 gasBefore = gasleft();
        createdMarket.disputeResolution{value: 2 ether}(1);
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();
        
        console.log("Dispute Gas:", gasUsed);
        
        assertEq(createdMarket.getDisputeVotes(1), 2 ether);
    }
    
    // ═══════════════════════════════════════════════════════
    // STRESS TESTS
    // ═══════════════════════════════════════════════════════
    
    function test_Stress_HighVolumeTrading() public {
        console.log("\n=== STRESS TEST: High Volume Trading ===");
        
        vm.prank(users[0]);
        uint256 marketId = factory.createMarket{value: MINIMUM_DEPOSIT}(
            "High Volume Market",
            5,
            block.timestamp + 1 days
        );
        
        Market createdMarket = Market(payable(factory.getMarket(marketId)));
        
        uint256 totalBets = 200;
        uint256 totalGas = 0;
        
        for (uint256 i = 0; i < totalBets; i++) {
            address user = users[i % users.length];
            uint8 outcome = uint8(i % 5);
            
            vm.startPrank(user);
            uint256 gasBefore = gasleft();
            createdMarket.placeBet{value: 0.05 ether}(outcome);
            totalGas += gasBefore - gasleft();
            vm.stopPrank();
        }
        
        console.log("Total Bets Placed:", totalBets);
        console.log("Total Gas Used:", totalGas);
        console.log("Avg Gas per Bet:", totalGas / totalBets);
        console.log("Total Volume:", createdMarket.getTotalVolume() / 1 ether, "ETH");
    }
}
