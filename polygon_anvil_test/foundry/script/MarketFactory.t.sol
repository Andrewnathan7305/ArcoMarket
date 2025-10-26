// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MarketFactory.sol";
import "../src/Market.sol";

contract MarketFactoryTest is Test {
    MarketFactory factory;

    // Example minimum deposit: 0.01 ether
    uint256 constant MINIMUM_DEPOSIT = 0.01 ether;

    function setUp() public {
        factory = new MarketFactory(MINIMUM_DEPOSIT);
    }

    function testDeployment() public {
        assertTrue(address(factory) != address(0));
        assertEq(factory.minimumDeposit(), MINIMUM_DEPOSIT);
    }

    function testCreateMarket() public {
        string memory question = "Who will win?";
        uint256 numOutcomes = 2;
        uint256 closingTime = block.timestamp + 1 days;

        // Fund test contract with ether
        vm.deal(address(this), 1 ether);

        // Call createMarket, sending minimum deposit
        uint256 marketId = factory.createMarket{value: MINIMUM_DEPOSIT}(
            question,
            numOutcomes,
            closingTime
        );

        address marketAddr = factory.getMarket(marketId);
        assertTrue(marketAddr != address(0));

        // Interact with created Market instance
        Market mkt = Market(payable(marketAddr));
        assertEq(mkt.question(), question);
        assertEq(mkt.numOutcomes(), numOutcomes);
        assertEq(mkt.creator(), address(this));
    }

    function testCreateMarketRevertIfNotEnoughDeposit() public {
        string memory question = "Underdog?";
        uint256 numOutcomes = 2;
        uint256 closingTime = block.timestamp + 1 days;
        uint256 tooLowDeposit = MINIMUM_DEPOSIT - 1;

        vm.expectRevert("Insufficient deposit");
        factory.createMarket{value: tooLowDeposit}(
            question,
            numOutcomes,
            closingTime
        );
    }
}
