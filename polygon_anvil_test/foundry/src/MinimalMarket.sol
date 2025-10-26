// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MinimalMarket
 * @notice Minimal contract for testing (Standard EVM)
 * @dev Converted from Arcology concurrent version
 */
contract MinimalMarket {
    
    uint256 public totalBets;
    uint256 public totalVolume;
    
    mapping(address => uint256) public userBets;
    mapping(address => uint256) public userVolume;
    
    event BetPlaced(address indexed user, uint256 amount);
    
    constructor() {
        totalBets = 0;
        totalVolume = 0;
    }
    
    /**
     * @notice Just increment counter - with payable
     */
    function placeBet() external payable {
        // Increment counter
        totalBets++;
        totalVolume += msg.value;
        
        // Track user bets
        userBets[msg.sender]++;
        userVolume[msg.sender] += msg.value;
        
        emit BetPlaced(msg.sender, msg.value);
    }
    
    /**
     * @notice Get total bets count
     */
    function getTotalBets() external view returns (uint256) {
        return totalBets;
    }
    
    /**
     * @notice Get total volume
     */
    function getTotalVolume() external view returns (uint256) {
        return totalVolume;
    }
    
    /**
     * @notice Get user bet count
     */
    function getUserBets(address _user) external view returns (uint256) {
        return userBets[_user];
    }
    
    /**
     * @notice Get user volume
     */
    function getUserVolume(address _user) external view returns (uint256) {
        return userVolume[_user];
    }
    
    receive() external payable {}
}
