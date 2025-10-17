// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@arcologynetwork/concurrentlib/lib/commutative/U256Cum.sol";

/**
 * @title MinimalMarket
 * @notice Absolutely minimal contract to test parallel execution
 */
contract MinimalMarket {
    
    U256Cumulative public totalBets;
    
    event BetPlaced(address indexed user, uint256 amount);
    
    constructor() {
        totalBets = new U256Cumulative(0, 1000000000);
    }
    
    /**
     * @notice Just increment counter - with payable
     */
    function placeBet() external payable {
        // Only increment counter - accept value but no require
        totalBets.add(1);
        
        emit BetPlaced(msg.sender, msg.value);
    }
    
    function getTotalBets() external returns (uint256) {
        return totalBets.get();
    }
    
    receive() external payable {}
}

