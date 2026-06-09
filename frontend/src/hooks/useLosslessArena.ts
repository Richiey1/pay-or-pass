import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useBalance } from "wagmi";
import { formatEther, parseEther } from "viem";
import { LOSSLESS_ARENA_ABI, CONTRACT_ADDRESS } from "@/lib/constants/contracts";

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
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  
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
  const { data: totalStakeData, refetch: refetchTotalStake } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "totalArenaStake",
  });
  
  const { data: currentPrizeData, refetch: refetchPrize } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "getCurrentPrizePool",
  });
  
  const { data: activePlayersData, refetch: refetchPlayers } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "getActivePlayers",
  });

  const { data: myGladiatorData, refetch: refetchMyGladiator } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "gladiators",
    args: address ? [address] : undefined,
  });

  const { data: entryFeeData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "entryFee",
  });

  const { data: isAdminData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
  });

  // Formatted/Derived states
  const totalStake = totalStakeData ? formatEther(totalStakeData as bigint) : "0.0";
  const currentPrize = currentPrizeData ? formatEther(currentPrizeData as bigint) : "0.000";
  const activePlayers = (activePlayersData as string[]) || [];
  const entryFee = entryFeeData ? formatEther(entryFeeData as bigint) : "10.0";
  
  const ADMIN_WALLETS = ["0xC1e4453d98fEe92504A2dC2114e6613053880A30"];
  const isAdmin = address && (
    ADMIN_WALLETS.some(admin => admin.toLowerCase() === address.toLowerCase()) || 
    isAdminData === true
  );
  
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
  const enterArena = async (customAmount?: string) => {
    if (!isConnected) return;
    try {
      setActiveAction("enter");
      setTxState("preparing");
      setTxError(null);
      
      const stakeVal = customAmount ? parseEther(customAmount) : (entryFeeData as bigint || parseEther("10"));
      if (balanceData && balanceData.value < stakeVal) {
        throw new Error(`Insufficient CELO balance. Required: ${formatEther(stakeVal)} CELO, Available: ${formattedBalance} CELO`);
      }

      // Simulate step (e.g. small delay for simulation standard look)
      await new Promise(r => setTimeout(r, 800));

      setTxState("broadcasting");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: "enterArena",
        value: stakeVal,
      });

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

      setTxState("broadcasting");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: "fight",
        args: [selectedOpponent as `0x${string}`],
      });

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
        functionName: "exitArena",
      });

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to exit Arena");
      throw err;
    }
  };

  // Live polling for prize pool
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPrize();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchPrize]);

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
  };
}
