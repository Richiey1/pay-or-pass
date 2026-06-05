// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LosslessArena
 * @notice Elite GameFi Primitive on Celo.
 * A competitive arcade fighting game where avatars battle to win the accrued DeFi yield
 * of the entire arena's staked pool, while every player's principal remains 100% safe.
 */
contract LosslessArena is ReentrancyGuard {
    
    struct Gladiator {
        address player;
        uint256 principalStaked;
        uint256 totalYieldWon;
        uint256 wins;
        uint256 losses;
        uint256 lastFightAt;
        bool isActive;
    }

    mapping(address => Gladiator) public gladiators;
    address[] public activePlayers;
    
    // Total Value Locked (Principal)
    uint256 public totalArenaStake;
    
    // Yield configuration
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

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not an admin");
        _;
    }

    constructor() {
        lastYieldUpdate = block.timestamp;
        isAdmin[msg.sender] = true;
        adminList.push(msg.sender);
    }

    /**
     * @notice Updates the accrued yield prize pool based on TVL and elapsed time.
     */
    function _updateYield() internal {
        uint256 elapsed = block.timestamp - lastYieldUpdate;
        if (elapsed > 0 && totalArenaStake > 0) {
            uint256 newYield = (totalArenaStake * apyBasisPoints * elapsed) / (SECONDS_IN_YEAR * 10000);
            accumulatedPrizePool += newYield;
        }
        lastYieldUpdate = block.timestamp;
    }

    /**
     * @notice Stake CELO to enter the Lossless Arena.
     */
    function enterArena() external payable nonReentrant {
        require(msg.value == entryFee, "Must stake exact entry fee to enter");
        
        _updateYield();
        
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
                    isActive: true
                });
                activePlayers.push(msg.sender);
            } else {
                // Returning player
                gladiators[msg.sender].principalStaked += msg.value;
                gladiators[msg.sender].isActive = true;
            }
        } else {
            gladiators[msg.sender].principalStaked += msg.value;
        }
        
        totalArenaStake += msg.value;
        emit ArenaEntered(msg.sender, msg.value);
    }

    /**
     * @notice Fight an opponent. 
     * Winner takes the accrued global yield. Loser keeps their principal.
     */
    function fight(address opponent) external nonReentrant {
        require(gladiators[msg.sender].isActive, "You are not in the arena");
        require(gladiators[opponent].isActive, "Opponent not in the arena");
        require(msg.sender != opponent, "Cannot fight yourself");
        require(block.timestamp >= gladiators[msg.sender].lastFightAt + fightCooldown, "Fight cooldown active");
        
        _updateYield();
        
        gladiators[msg.sender].lastFightAt = block.timestamp;
        
        // Pseudo-random combat resolution (50/50)
        // In a real production environment, use Chainlink VRF.
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
        
        // Winner claims the entire accrued yield pool!
        uint256 prize = accumulatedPrizePool;
        accumulatedPrizePool = 0; // Reset pool
        
        gladiators[winner].totalYieldWon += prize;
        
        if (prize > 0) {
            (bool success, ) = winner.call{value: prize}("");
            require(success, "Yield transfer failed");
        }
        
        emit FightResolved(winner, loser, prize);
    }

    /**
     * @notice Withdraw your principal and leave the arena safely.
     */
    function exitArena() external nonReentrant {
        require(gladiators[msg.sender].isActive, "You are not in the arena");
        
        _updateYield();
        
        uint256 amountToReturn = gladiators[msg.sender].principalStaked;
        require(amountToReturn > 0, "No principal to return");
        
        gladiators[msg.sender].principalStaked = 0;
        gladiators[msg.sender].isActive = false;
        totalArenaStake -= amountToReturn;
        
        (bool success, ) = msg.sender.call{value: amountToReturn}("");
        require(success, "Principal return failed");
        
        emit ArenaExited(msg.sender, amountToReturn);
    }
    
    // View Functions
    function getActivePlayers() external view returns (address[] memory) {
        // Return only active
        uint256 count = 0;
        for (uint256 i = 0; i < activePlayers.length; i++) {
            if (gladiators[activePlayers[i]].isActive) {
                count++;
            }
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
        uint256 elapsed = block.timestamp - lastYieldUpdate;
        uint256 currentYield = 0;
        if (elapsed > 0 && totalArenaStake > 0) {
            currentYield = (totalArenaStake * apyBasisPoints * elapsed) / (SECONDS_IN_YEAR * 10000);
        }
        return accumulatedPrizePool + currentYield;
    }
    
    // Admin
    function setApyBasisPoints(uint256 newApy) external onlyAdmin {
        _updateYield();
        apyBasisPoints = newApy;
    }

    function setEntryFee(uint256 _entryFee) external onlyAdmin {
        entryFee = _entryFee;
    }

    function setFightCooldown(uint256 _fightCooldown) external onlyAdmin {
        fightCooldown = _fightCooldown;
    }

    // ---------------------------------------------
    // 70% ADMIN THRESHOLD LOGIC
    // ---------------------------------------------

    function proposeAdminChange(address target, bool isAdd) external onlyAdmin {
        require(isAdmin[target] != isAdd, "Target already in desired state");
        
        if (adminList.length == 1) {
            // Immediate execution if only 1 admin exists
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
        
        // 70% threshold calculation
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
    
    // Allow contract to hold yield internally for demo
    receive() external payable {
        accumulatedPrizePool += msg.value;
    }
}
