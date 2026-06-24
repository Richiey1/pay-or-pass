// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IYieldProtocol {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IYieldToken {
    function balanceOf(address user) external view returns (uint256);
}

/**
 * @title LosslessArena
 * @notice Elite GameFi Primitive on Celo.
 * A competitive arcade fighting game where avatars battle to win the accrued DeFi yield
 * of the entire arena's staked pool, while every player's principal remains 100% safe.
 * Now natively integrated with Moola Market for real Celo yield.
 */
contract LosslessArena is ReentrancyGuard {
    
    enum YieldStrategy { SIMULATED, MOOLA }

    struct Gladiator {
        address player;
        uint256 principalStaked;
        uint256 totalYieldWon;
        uint256 wins;
        uint256 losses;
        uint256 lastFightAt;
        bool isActive;
        YieldStrategy strategy;
    }

    mapping(address => Gladiator) public gladiators;
    address[] public activePlayers;
    
    // Total Value Locked (Principal)
    uint256 public totalSimulatedStake;
    uint256 public totalMoolaStake;
    
    // Moola Yield configuration
    address public yieldPool;
    address public mTokenAddress;
    address public constant CELO_ERC20 = 0x471EcE3750Da237f93B8E339c536989b8978a438; // Celo native ERC20 wrapper

    // Simulated Yield configuration
    uint256 public constant SECONDS_IN_YEAR = 31536000;
    uint256 public apyBasisPoints = 800; // 8% APY
    uint256 public lastYieldUpdate;
    uint256 public accumulatedPrizePool;
    
    // Game Rules
    uint256 public entryFee = 10 ether; // 10 CELO
    uint256 public fightCooldown = 1 minutes;
    
    // Admin Role Flexibility (70% Threshold)
    mapping(address => bool) public isAdmin;
    address[] public adminList;

    struct AdminProposal {
        address target;
        bool isAdd;
        uint256 approvals;
        bool executed;
    }
    
    // proposalId => adminAddress => hasApproved
    mapping(uint256 => mapping(address => bool)) public proposalApprovals;
    
    uint256 public nextProposalId;
    mapping(uint256 => AdminProposal) public proposals;

    event ArenaEntered(address indexed player, uint256 amount);
    event ArenaExited(address indexed player, uint256 amount);
    event FightResolved(address indexed winner, address indexed loser, uint256 yieldWon);
    event AdminProposalCreated(uint256 indexed proposalId, address indexed target, bool isAdd);
    event AdminProposalApproved(uint256 indexed proposalId, address indexed approver);
    event AdminProposalExecuted(uint256 indexed proposalId, address indexed target, bool isAdd);
    event YieldConfigured(address indexed pool, address indexed mToken);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not an admin");
        _;
    }

    constructor() {
        lastYieldUpdate = block.timestamp;
        isAdmin[msg.sender] = true;
        adminList.push(msg.sender);
    }

    function _updateSimulatedYield() internal {
        uint256 elapsed = block.timestamp - lastYieldUpdate;
        if (elapsed > 0 && totalSimulatedStake > 0) {
            uint256 newYield = (totalSimulatedStake * apyBasisPoints * elapsed) / (SECONDS_IN_YEAR * 10000);
            accumulatedPrizePool += newYield;
        }
        lastYieldUpdate = block.timestamp;
    }

    /**
     * @notice Set Moola Market Yield parameters
     */
    function setYieldConfig(address _yieldPool, address _mToken) external onlyAdmin {
        yieldPool = _yieldPool;
        mTokenAddress = _mToken;
        emit YieldConfigured(_yieldPool, _mToken);
    }

    function _depositToYield(uint256 amount) internal {
        if (yieldPool != address(0)) {
            IERC20(CELO_ERC20).approve(yieldPool, amount);
            IYieldProtocol(yieldPool).deposit(CELO_ERC20, amount, address(this), 0);
        }
    }

    function _withdrawFromYield(uint256 amount, address to) internal {
        if (yieldPool != address(0)) {
            IYieldProtocol(yieldPool).withdraw(CELO_ERC20, amount, to);
        } else {
            (bool success, ) = to.call{value: amount}("");
            require(success, "Native transfer failed");
        }
    }

    /**
     * @notice Stake CELO to enter the Lossless Arena.
     */
    function enterArena(YieldStrategy strategy) external payable nonReentrant {
        require(msg.value == entryFee, "Must stake exact entry fee to enter");
        
        _updateSimulatedYield();

        if (!gladiators[msg.sender].isActive) {
            if (gladiators[msg.sender].principalStaked == 0) {
                // New player
                gladiators[msg.sender] = Gladiator({
                    player: msg.sender,
                    principalStaked: msg.value,
                    totalYieldWon: 0,
                    wins: 0,
                    losses: 0,
                    lastFightAt: 0,
                    isActive: true,
                    strategy: strategy
                });
                activePlayers.push(msg.sender);
            } else {
                // Returning player
                gladiators[msg.sender].principalStaked += msg.value;
                gladiators[msg.sender].isActive = true;
                gladiators[msg.sender].strategy = strategy;
            }
        } else {
            gladiators[msg.sender].principalStaked += msg.value;
            // Strategy remains the same if they just top up
            strategy = gladiators[msg.sender].strategy;
        }
        
        if (strategy == YieldStrategy.MOOLA) {
            totalMoolaStake += msg.value;
            _depositToYield(msg.value);
        } else {
            totalSimulatedStake += msg.value;
        }
        
        emit ArenaEntered(msg.sender, msg.value);
    }

    /**
     * @notice Fight an opponent. 
     * Winner takes the accrued Moola Market yield. Loser keeps their principal.
     */
    function fight(address opponent) external nonReentrant {
        require(gladiators[msg.sender].isActive, "You are not in the arena");
        require(gladiators[opponent].isActive, "Opponent not in the arena");
        require(msg.sender != opponent, "Cannot fight yourself");
        require(block.timestamp >= gladiators[msg.sender].lastFightAt + fightCooldown, "Fight cooldown active");
        
        gladiators[msg.sender].lastFightAt = block.timestamp;
        
        // Pseudo-random combat resolution (50/50)
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, opponent, totalArenaStake))) % 100;
        
        address winner;
        address loser;
        
        if (random >= 50) {
            winner = msg.sender;
            loser = opponent;
        } else {
            winner = opponent;
            loser = msg.sender;
        }
        
        gladiators[winner].wins++;
        gladiators[loser].losses++;
        
        _updateSimulatedYield();

        // Calculate Moola yield
        uint256 currentMoolaBalance = 0;
        if (yieldPool != address(0) && mTokenAddress != address(0)) {
            currentMoolaBalance = IYieldToken(mTokenAddress).balanceOf(address(this));
        }

        uint256 moolaPrize = 0;
        if (currentMoolaBalance > totalMoolaStake) {
            moolaPrize = currentMoolaBalance - totalMoolaStake;
        }

        // Calculate Simulated yield
        uint256 simulatedPrize = accumulatedPrizePool;
        accumulatedPrizePool = 0; // Reset simulated pool

        uint256 totalPrize = moolaPrize + simulatedPrize;
        
        if (totalPrize > 0) {
            gladiators[winner].totalYieldWon += totalPrize;
            
            // Withdraw Moola portion
            if (moolaPrize > 0) {
                _withdrawFromYield(moolaPrize, winner);
            }
            
            // Transfer simulated portion
            if (simulatedPrize > 0) {
                (bool success, ) = winner.call{value: simulatedPrize}("");
                require(success, "Simulated yield transfer failed");
            }
        }
        
        emit FightResolved(winner, loser, totalPrize);
    }

    /**
     * @notice Withdraw your principal and leave the arena safely.
     */
    function exitArena() external nonReentrant {
        require(gladiators[msg.sender].isActive, "You are not in the arena");
        
        _updateSimulatedYield();

        uint256 amountToReturn = gladiators[msg.sender].principalStaked;
        require(amountToReturn > 0, "No principal to return");
        
        gladiators[msg.sender].principalStaked = 0;
        gladiators[msg.sender].isActive = false;
        
        if (gladiators[msg.sender].strategy == YieldStrategy.MOOLA) {
            totalMoolaStake -= amountToReturn;
            _withdrawFromYield(amountToReturn, msg.sender);
        } else {
            totalSimulatedStake -= amountToReturn;
            (bool success, ) = msg.sender.call{value: amountToReturn}("");
            require(success, "Principal return failed");
        }
        
        emit ArenaExited(msg.sender, amountToReturn);
    }
    
    // View Functions
    function getActivePlayers() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < activePlayers.length; i++) {
            if (gladiators[activePlayers[i]].isActive) count++;
        }
        address[] memory active = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < activePlayers.length; i++) {
            if (gladiators[activePlayers[i]].isActive) {
                active[idx] = activePlayers[i];
                idx++;
            }
        }
        return active;
    }

    function getCurrentPrizePool() external view returns (uint256) {
        // Moola Yield
        uint256 moolaPrize = 0;
        if (yieldPool != address(0) && mTokenAddress != address(0)) {
            uint256 currentBalance = IYieldToken(mTokenAddress).balanceOf(address(this));
            if (currentBalance > totalMoolaStake) {
                moolaPrize = currentBalance - totalMoolaStake;
            }
        }

        // Simulated Yield
        uint256 elapsed = block.timestamp - lastYieldUpdate;
        uint256 currentSimulatedYield = 0;
        if (elapsed > 0 && totalSimulatedStake > 0) {
            currentSimulatedYield = (totalSimulatedStake * apyBasisPoints * elapsed) / (SECONDS_IN_YEAR * 10000);
        }

        return accumulatedPrizePool + currentSimulatedYield + moolaPrize;
    }
    
    function setApyBasisPoints(uint256 newApy) external onlyAdmin {
        _updateSimulatedYield();
        apyBasisPoints = newApy;
    }
    
    function setEntryFee(uint256 _entryFee) external onlyAdmin {
        entryFee = _entryFee;
    }

    function setFightCooldown(uint256 _fightCooldown) external onlyAdmin {
        fightCooldown = _fightCooldown;
    }

    function proposeAdminChange(address target, bool isAdd) external onlyAdmin {
        require(isAdmin[target] != isAdd, "Target already in desired state");
        if (adminList.length == 1) {
            _executeAdminChange(target, isAdd);
            return;
        }
        uint256 proposalId = nextProposalId++;
        AdminProposal storage p = proposals[proposalId];
        p.target = target;
        p.isAdd = isAdd;
        proposalApprovals[proposalId][msg.sender] = true;
        p.approvals = 1;
        emit AdminProposalCreated(proposalId, target, isAdd);
        emit AdminProposalApproved(proposalId, msg.sender);
        _checkAndExecuteProposal(proposalId);
    }

    function approveAdminChange(uint256 proposalId) external onlyAdmin {
        AdminProposal storage p = proposals[proposalId];
        require(!p.executed, "Already executed");
        require(!proposalApprovals[proposalId][msg.sender], "Already approved");
        require(isAdmin[p.target] != p.isAdd, "Target already in desired state");
        proposalApprovals[proposalId][msg.sender] = true;
        p.approvals++;
        emit AdminProposalApproved(proposalId, msg.sender);
        _checkAndExecuteProposal(proposalId);
    }

    function _checkAndExecuteProposal(uint256 proposalId) internal {
        AdminProposal storage p = proposals[proposalId];
        uint256 requiredApprovals = (adminList.length * 70 + 99) / 100;
        if (p.approvals >= requiredApprovals) {
            p.executed = true;
            _executeAdminChange(p.target, p.isAdd);
            emit AdminProposalExecuted(proposalId, p.target, p.isAdd);
        }
    }

    function _executeAdminChange(address target, bool isAdd) internal {
        if (isAdd) {
            isAdmin[target] = true;
            adminList.push(target);
        } else {
            isAdmin[target] = false;
            for (uint256 i = 0; i < adminList.length; i++) {
                if (adminList[i] == target) {
                    adminList[i] = adminList[adminList.length - 1];
                    adminList.pop();
                    break;
                }
            }
        }
    }
    
    receive() external payable {
        accumulatedPrizePool += msg.value;
    }
}
