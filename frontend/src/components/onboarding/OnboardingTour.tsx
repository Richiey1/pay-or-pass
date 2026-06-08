"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Users, Timer, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Pay or Pass?",
    description: "A social game of pressure. You receive a request: pay the small amount or pass a higher amount to someone else.",
    icon: <Flame className="w-6 h-6 text-red-500" />,
    color: "from-red-600/20 to-transparent",
  },
  {
    title: "The Multiplier",
    description: "Every time someone passes, the cost increases by 20%. Don't be the one caught when the timer hits zero!",
    icon: <Users className="w-6 h-6 text-purple-500" />,
    color: "from-purple-600/20 to-transparent",
  },
  {
    title: "Survival is Key",
    description: "Strategic passing is everything. Choose your targets wisely and keep the chain moving.",
    icon: <Timer className="w-6 h-6 text-amber-500" />,
    color: "from-amber-600/20 to-transparent",
  },
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("payorpass_tour_seen");
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("payorpass_tour_seen", "true");
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl"
      >
        {/* Animated Background Accent */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${slides[currentSlide].color} opacity-40 transition-colors duration-700 pointer-events-none`}
        />

        {/* Top Navigation Bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4">
          {/* Progress Indicators */}
          <div className="flex gap-1.5">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-350 ${
                  index === currentSlide ? "w-6 bg-red-500" : "w-2 bg-zinc-800"
                }`}
              />
            ))}
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body (Horizontal Layout) */}
        <div className="relative z-10 p-5 flex items-start gap-4">
          {/* Icon Column */}
          <div className="flex-shrink-0 p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/80 shadow-md">
            {slides[currentSlide].icon}
          </div>

          {/* Text Column */}
          <div className="flex-grow min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-base font-black text-white uppercase tracking-tight">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-zinc-400 text-xs font-semibold leading-relaxed mt-1.5 pr-2">
                  {slides[currentSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="relative z-10 flex items-center justify-between border-t border-zinc-900/60 px-5 py-3.5 bg-zinc-950/20">
          <button
            onClick={handleClose}
            className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Skip
          </button>
          
          <button
            onClick={nextSlide}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-[10px] rounded-xl transition-all active:scale-[0.97] flex items-center gap-1.5 shadow-md shadow-red-950/20 group"
          >
            {currentSlide === slides.length - 1 ? "Start" : "Next"}
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
