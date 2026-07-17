import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useBalance, usePublicClient } from "wagmi";
import { formatEther, parseEther, parseUnits, keccak256, encodePacked } from "viem";
import { readContract } from "wagmi/actions";
import { useConfig } from "wagmi";
import { LOSSLESS_ARENA_ABI, CONTRACT_ADDRESS, FUNCTION_NAMES } from "@/lib/constants/contracts";
import { ERC20_ABI } from "@/lib/constants/erc20";
import { useCeloFeeCurrency } from './useCeloFeeCurrency';

export interface Gladiator {
  player: string;
  principalStaked: bigint;
  totalYieldWon: bigint;
  wins: bigint;
  losses: bigint;
  lastFightAt: bigint;
  isActive: boolean;
}

export type TxState = "idle" | "preparing" | "broadcasting" | "confirming" | "confirmed" | "error";

export function useLosslessArena() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient();
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  const { feeCurrency } = useCeloFeeCurrency();
  
  // Transaction lifecycle state
  const [txState, setTxState] = useState<TxState>("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"enter" | "fight" | "exit" | null>(null);

  // User's balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  });

  const formattedBalance = balanceData ? formatEther(balanceData.value) : "0.0";

  // Contract Reads
  const { data: totalStakeData, isLoading: isLoadingStake, refetch: refetchTotalStake } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.TOTAL_ARENA_STAKE,
  });
  
  const { data: currentPrizeData, isLoading: isLoadingPrize, refetch: refetchPrize } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.GET_CURRENT_PRIZE_POOL,
    args: ["0x471EcE3750Da237f93B8E339c536989b8978a438"],
  });
  
  const { data: activePlayersData, isLoading: isLoadingPlayers, refetch: refetchPlayers } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.GET_ACTIVE_PLAYERS,
  });

  const { data: myGladiatorData, isLoading: isLoadingGladiator, refetch: refetchMyGladiator } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.GLADIATORS,
    args: address ? [address] : undefined,
  });

  const { data: entryFeeData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.ENTRY_FEE,
    args: ["0x471EcE3750Da237f93B8E339c536989b8978a438"], // CELO_ERC20 in PayOrPass
  });

  const { data: isAdminData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.IS_ADMIN,
    args: address ? [address] : undefined,
  });

  // Formatted/Derived states
  const totalStake = totalStakeData ? formatEther(totalStakeData as bigint) : "0.0";
  const currentPrize = currentPrizeData ? formatEther(currentPrizeData as bigint) : "0.000";
  const activePlayers = Array.from(new Set(((activePlayersData as string[]) || []).map(a => a.toLowerCase())));
  const entryFee = entryFeeData ? formatEther(entryFeeData as bigint) : "";
  
  const { data: ownerData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.OWNER,
  });

  const isAdmin = address && (
    isAdminData === true || (ownerData && (ownerData as string).toLowerCase() === address.toLowerCase())
  );
  const isLoading = isLoadingStake || isLoadingPrize || isLoadingPlayers || isLoadingGladiator;

  
  const myGladiator = myGladiatorData as any;
  const isInArena = myGladiator ? myGladiator[6] : false; // isActive field
  const myWins = myGladiator ? Number(myGladiator[3]) : 0;
  const myLosses = myGladiator ? Number(myGladiator[4]) : 0;
  const myYieldWon = myGladiator ? formatEther(myGladiator[2]) : "0.0";

  // Contract Writes
  const { writeContractAsync } = useWriteContract();

  const triggerRefetch = useCallback(() => {
    refetchMyGladiator();
    refetchPlayers();
    refetchTotalStake();
    refetchPrize();
    refetchBalance();
  }, [refetchMyGladiator, refetchPlayers, refetchTotalStake, refetchPrize, refetchBalance]);

  // Actions
  const enterArena = async (customAmount: string, token: string, strategy: number) => {
    if (!isConnected) return;
    try {
      setActiveAction("enter");
      setTxState("preparing");
      setTxError(null);
      
      const isStable = token.toLowerCase() === "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e".toLowerCase() || token.toLowerCase() === "0xcebA9300f2b948710d2653dD7B07f33A8B32118C".toLowerCase();
      const stakeVal = parseUnits(customAmount || "10", isStable ? 6 : 18);
      if (token === "0x0000000000000000000000000000000000000000" && balanceData && balanceData.value < stakeVal) {
        throw new Error(`Insufficient CELO balance. Required: ${formatEther(stakeVal)} CELO, Available: ${formattedBalance} CELO`);
      }

      // Check and Approve ERC20 if needed
      if (token !== "0x0000000000000000000000000000000000000000" && address) {
        setTxState("preparing");
        const currentAllowance = await readContract(config, {
          address: token as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, CONTRACT_ADDRESS],
        }) as bigint;

        if (currentAllowance < stakeVal) {
          setTxState("broadcasting");
          const approveHash = await writeContractAsync({
            address: token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [CONTRACT_ADDRESS, stakeVal],
            ...(feeCurrency ? { feeCurrency } : {}),
          } as any);
          // Wait for approval confirmation
          if (publicClient) {
            setTxState("confirming");
            const receipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
            if (receipt.status !== 'success') {
              throw new Error("Approval transaction reverted on-chain");
            }
          } else {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }

      setTxState("broadcasting");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.ENTER_ARENA,
        args: [token as `0x${string}`],
        value: token === "0x0000000000000000000000000000000000000000" ? stakeVal : BigInt(0),
        ...(feeCurrency ? { feeCurrency } : {}),
      } as any);

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to enter Arena");
      throw err;
    }
  };

  const fight = async () => {
    if (!isConnected || !selectedOpponent) return;
    try {
      setActiveAction("fight");
      setTxState("preparing");
      setTxError(null);

      // Simulate step
      await new Promise(r => setTimeout(r, 800));

      const randomChoice = Math.floor(Math.random() * 3) + 1; // 1: Attack, 2: Defend, 3: Invest
      const salt = "salt_" + Math.random().toString();
      const commitHash = keccak256(encodePacked(["uint8", "string"], [randomChoice, salt]));

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.SUBMIT_CHOICE,
        args: [selectedOpponent as `0x${string}`, commitHash],
        ...(feeCurrency ? { feeCurrency } : {}),
      } as any);

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to initiate fight");
      throw err;
    }
  };

  const exitArena = async () => {
    if (!isConnected) return;
    try {
      setActiveAction("exit");
      setTxState("preparing");
      setTxError(null);

      // Simulate step
      await new Promise(r => setTimeout(r, 800));

      setTxState("broadcasting");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.EXIT_ARENA,
        ...(feeCurrency ? { feeCurrency } : {}),
      } as any);

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to exit Arena");
      throw err;
    }
  };

  // User must manually trigger refetch from the UI to avoid annoying page reloads

  return {
    address,
    isConnected,
    totalStake,
    currentPrize,
    activePlayers,
    entryFee,
    isAdmin,
    isInArena,
    myWins,
    myLosses,
    myYieldWon,
    selectedOpponent,
    setSelectedOpponent,
    enterArena,
    fight,
    exitArena,
    triggerRefetch,
    balance: balanceData,
    formattedBalance,
    txState,
    setTxState,
    txError,
    txHash,
    setTxHash,
    activeAction,
    isLoading,
  };
}
