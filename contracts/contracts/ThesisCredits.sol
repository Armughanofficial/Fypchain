// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ThesisCredits is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;
    uint256 public constant FAUCET_AMOUNT = 500 * 10 ** 18;

    mapping(address => bool) public hasClaimed;

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor() ERC20("Thesis Credits", "TCR") Ownable(msg.sender) {
        // Mint entire fixed supply to the contract itself to act as the platform treasury
        _mint(address(this), INITIAL_SUPPLY);
    }

    function claimFaucet() external {
        require(!hasClaimed[msg.sender], "Faucet: Wallet has already claimed TCR");
        require(balanceOf(address(this)) >= FAUCET_AMOUNT, "Faucet: Treasury empty");

        hasClaimed[msg.sender] = true;
        _transfer(address(this), msg.sender, FAUCET_AMOUNT);

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }
}