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

contract PayOrPass is ReentrancyGuard {
    
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
        address stakeToken;
    }

    mapping(address => Gladiator) public gladiators;
    address[] public activePlayers;
    
    mapping(address => uint256) public totalSimulatedStakes;
    mapping(address => uint256) public totalMoolaStakes;
    mapping(address => uint256) public accumulatedPrizePools;
    
    mapping(address => address) public yieldPools;
    mapping(address => address) public mTokens;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public entryFees;

    address public constant CELO_ERC20 = 0x471EcE3750Da237f93B8E339c536989b8978a438; 

    uint256 public constant SECONDS_IN_YEAR = 31536000;
    uint256 public apyBasisPoints = 800; // 8% APY
    uint256 public lastYieldUpdate;
    
    uint256 public fightCooldown = 1 minutes;
    
    mapping(address => bool) public isAdmin;
    address[] public adminList;

    struct AdminProposal {
        address target;
        bool isAdd;
        uint256 approvals;
        bool executed;
    }
    
    mapping(uint256 => mapping(address => bool)) public proposalApprovals;
    uint256 public nextProposalId;
    mapping(uint256 => AdminProposal) public proposals;

    event ArenaEntered(address indexed player, uint256 amount);
    event ArenaExited(address indexed player, uint256 amount);
    event FightResolved(address indexed winner, address indexed loser, uint256 yieldWon);
    event AdminProposalCreated(uint256 indexed proposalId, address indexed target, bool isAdd);
    event AdminProposalApproved(uint256 indexed proposalId, address indexed approver);
    event AdminProposalExecuted(uint256 indexed proposalId, address indexed target, bool isAdd);
    event YieldConfigured(address indexed pool, address indexed mToken, address indexed token);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not an admin");
        _;
    }

    constructor() {
        lastYieldUpdate = block.timestamp;
        isAdmin[msg.sender] = true;
        adminList.push(msg.sender);
        
        supportedTokens[CELO_ERC20] = true;
        entryFees[CELO_ERC20] = 10 ether;
        
        address USDM = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
        supportedTokens[USDM] = true;
        entryFees[USDM] = 5 ether;

        address EURM = 0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73;
        supportedTokens[EURM] = true;
        entryFees[EURM] = 5 ether;

        address USDT = 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e;
        supportedTokens[USDT] = true;
        entryFees[USDT] = 5 ether;

        address USDC = 0xcebA9300f2b948710d2653dD7B07f33A8B32118C;
        supportedTokens[USDC] = true;
        entryFees[USDC] = 5 ether;
    }

    function _updateSimulatedYield() internal {
        uint256 elapsed = block.timestamp - lastYieldUpdate;
        if (elapsed > 0) {
            address[5] memory tokens = [
                CELO_ERC20, 
                0x765DE816845861e75A25fCA122bb6898B8B1282a, 
                0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73, 
                0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e, 
                0xcebA9300f2b948710d2653dD7B07f33A8B32118C
            ];
            for (uint i = 0; i < tokens.length; i++) {
                if (totalSimulatedStakes[tokens[i]] > 0) {
                    uint256 newYield = (totalSimulatedStakes[tokens[i]] * apyBasisPoints * elapsed) / (SECONDS_IN_YEAR * 10000);
                    accumulatedPrizePools[tokens[i]] += newYield;
                }
            }
        }
        lastYieldUpdate = block.timestamp;
    }

    function setYieldConfig(address token, address _yieldPool, address _mToken) external onlyAdmin {
        yieldPools[token] = _yieldPool;
        mTokens[token] = _mToken;
        emit YieldConfigured(_yieldPool, _mToken, token);
    }

    function setTokenSupport(address token, bool isSupported, uint256 fee) external onlyAdmin {
        supportedTokens[token] = isSupported;
        entryFees[token] = fee;
    }

    function _depositToYield(uint256 amount, address token) internal {
        address pool = yieldPools[token];
        if (pool != address(0)) {
            IERC20(token).approve(pool, amount);
            IYieldProtocol(pool).deposit(token, amount, address(this), 0);
        }
    }

    function _withdrawFromYield(uint256 amount, address to, address token) internal {
        address pool = yieldPools[token];
        if (pool != address(0)) {
            IYieldProtocol(pool).withdraw(token, amount, to);
        } else {
            if (token == CELO_ERC20) {
                (bool success, ) = to.call{value: amount}("");
                require(success, "Native transfer failed");
            } else {
                require(IERC20(token).transfer(to, amount), "ERC20 transfer failed");
            }
        }
    }

    function enterArena(YieldStrategy strategy, address token) external payable nonReentrant {
        uint256 amount;
        if (token == address(0)) {
            token = CELO_ERC20;
        }
        require(supportedTokens[token], "Unsupported token");

        if (token == CELO_ERC20) {
            require(msg.value == entryFees[token], "Must stake exact entry fee to enter");
            amount = msg.value;
        } else {
            require(msg.value == 0, "Do not send native CELO for ERC20 entry");
            amount = entryFees[token];
            require(IERC20(token).transferFrom(msg.sender, address(this), amount), "ERC20 transfer failed");
        }
        
        _updateSimulatedYield();

        if (!gladiators[msg.sender].isActive) {
            if (gladiators[msg.sender].principalStaked == 0) {
                gladiators[msg.sender] = Gladiator({
                    player: msg.sender,
                    principalStaked: amount,
                    totalYieldWon: 0,
                    wins: 0,
                    losses: 0,
                    lastFightAt: 0,
                    isActive: true,
                    strategy: strategy,
                    stakeToken: token
                });
                activePlayers.push(msg.sender);
            } else {
                require(gladiators[msg.sender].stakeToken == token, "Must use same token");
                gladiators[msg.sender].principalStaked += amount;
                gladiators[msg.sender].isActive = true;
                gladiators[msg.sender].strategy = strategy;
            }
        } else {
            require(gladiators[msg.sender].stakeToken == token, "Must use same token");
            gladiators[msg.sender].principalStaked += amount;
            strategy = gladiators[msg.sender].strategy;
        }
        
        if (strategy == YieldStrategy.MOOLA) {
            totalMoolaStakes[token] += amount;
            _depositToYield(amount, token);
        } else {
            totalSimulatedStakes[token] += amount;
        }
        
        emit ArenaEntered(msg.sender, amount);
    }

    function fight(address opponent) external nonReentrant {
        require(gladiators[msg.sender].isActive, "You are not in the arena");
        require(gladiators[opponent].isActive, "Opponent not in the arena");
        require(msg.sender != opponent, "Cannot fight yourself");
        require(block.timestamp >= gladiators[msg.sender].lastFightAt + fightCooldown, "Fight cooldown active");
        require(gladiators[msg.sender].stakeToken == gladiators[opponent].stakeToken, "Tokens must match");
        
        gladiators[msg.sender].lastFightAt = block.timestamp;
        
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, opponent))) % 100;
        
        address winner = random >= 50 ? msg.sender : opponent;
        address loser = random >= 50 ? opponent : msg.sender;
        
        gladiators[winner].wins++;
        gladiators[loser].losses++;
        
        _updateSimulatedYield();

        address winnerToken = gladiators[winner].stakeToken;

        uint256 moolaPrize = 0;
        if (yieldPools[winnerToken] != address(0) && mTokens[winnerToken] != address(0)) {
            uint256 currentBalance = IYieldToken(mTokens[winnerToken]).balanceOf(address(this));
            if (currentBalance > totalMoolaStakes[winnerToken]) moolaPrize = currentBalance - totalMoolaStakes[winnerToken];
        }

        uint256 simulatedPrize = accumulatedPrizePools[winnerToken];
        accumulatedPrizePools[winnerToken] = 0;

        uint256 totalPrize = moolaPrize + simulatedPrize;
        
        if (totalPrize > 0) {
            gladiators[winner].totalYieldWon += totalPrize;
            
            if (moolaPrize > 0) {
                _withdrawFromYield(moolaPrize, winner, winnerToken);
            }
            
            if (simulatedPrize > 0) {
                if (winnerToken == CELO_ERC20) {
                    (bool success, ) = winner.call{value: simulatedPrize}("");
                    require(success, "Simulated CELO yield transfer failed");
                } else {
                    require(IERC20(winnerToken).transfer(winner, simulatedPrize), "Simulated ERC20 yield transfer failed");
                }
            }
        }
        
        emit FightResolved(winner, loser, totalPrize);
    }

    function exitArena() external nonReentrant {
        require(gladiators[msg.sender].isActive, "You are not in the arena");
        
        _updateSimulatedYield();

        uint256 amountToReturn = gladiators[msg.sender].principalStaked;
        address token = gladiators[msg.sender].stakeToken;
        require(amountToReturn > 0, "No principal to return");
        
        gladiators[msg.sender].principalStaked = 0;
        gladiators[msg.sender].isActive = false;
        
        if (gladiators[msg.sender].strategy == YieldStrategy.MOOLA) {
            totalMoolaStakes[token] -= amountToReturn;
            _withdrawFromYield(amountToReturn, msg.sender, token);
        } else {
            totalSimulatedStakes[token] -= amountToReturn;
            if (token == CELO_ERC20) {
                (bool success, ) = msg.sender.call{value: amountToReturn}("");
                require(success, "Principal return failed");
            } else {
                require(IERC20(token).transfer(msg.sender, amountToReturn), "Principal ERC20 return failed");
            }
        }
        
        emit ArenaExited(msg.sender, amountToReturn);
    }
    
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

    function getCurrentPrizePool(address token) external view returns (uint256) {
        uint256 moolaPrize = 0;
        if (yieldPools[token] != address(0) && mTokens[token] != address(0)) {
            uint256 currentBalance = IYieldToken(mTokens[token]).balanceOf(address(this));
            if (currentBalance > totalMoolaStakes[token]) {
                moolaPrize = currentBalance - totalMoolaStakes[token];
            }
        }

        uint256 elapsed = block.timestamp - lastYieldUpdate;
        uint256 currentSimulatedYield = 0;
        if (elapsed > 0 && totalSimulatedStakes[token] > 0) {
            currentSimulatedYield = (totalSimulatedStakes[token] * apyBasisPoints * elapsed) / (SECONDS_IN_YEAR * 10000);
        }

        return accumulatedPrizePools[token] + currentSimulatedYield + moolaPrize;
    }
    
    function setApyBasisPoints(uint256 newApy) external onlyAdmin {
        _updateSimulatedYield();
        apyBasisPoints = newApy;
    }

    function setFightCooldown(uint256 _fightCooldown) external onlyAdmin {
        fightCooldown = _fightCooldown;
    }
    
    receive() external payable {
        accumulatedPrizePools[CELO_ERC20] += msg.value;
    }
}
