"use client";

import { motion } from "framer-motion";

const Shimmer = () => (
  <motion.div
    initial={{ x: "-100%" }}
    animate={{ x: "100%" }}
    transition={{
      repeat: Infinity,
      duration: 2,
      ease: "linear",
    }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent"
  />
);

export const ChainSkeleton = () => (
  <div className="relative overflow-hidden bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
    <div className="flex justify-between items-center">
      <div className="h-4 w-24 bg-zinc-800 rounded" />
      <div className="h-8 w-8 bg-zinc-800 rounded-full" />
    </div>
    <div className="h-10 w-full bg-zinc-800/50 rounded-xl" />
    <div className="flex justify-between gap-4">
      <div className="h-12 flex-1 bg-zinc-800 rounded-xl" />
      <div className="h-12 flex-1 bg-zinc-800 rounded-xl" />
    </div>
    <Shimmer />
  </div>
);

export const HistorySkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="relative overflow-hidden bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl flex items-center justify-between"
      >
        <div className="flex gap-3 items-center">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-32 bg-zinc-800 rounded" />
            <div className="h-2 w-20 bg-zinc-800/50 rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-zinc-800/70 rounded" />
        <Shimmer />
      </div>
    ))}
  </div>
);

export const UserStatsSkeleton = () => (
  <div className="relative overflow-hidden grid grid-cols-2 gap-4">
    {[1, 2].map((i) => (
      <div
        key={i}
        className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2"
      >
        <div className="h-2 w-16 bg-zinc-800 rounded" />
        <div className="h-6 w-20 bg-zinc-800 rounded" />
        <Shimmer />
      </div>
    ))}
  </div>
);
