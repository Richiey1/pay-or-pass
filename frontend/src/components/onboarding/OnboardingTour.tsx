"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Users, Timer, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Pay or Pass?",
    description: "A social game of pressure. You receive a request: pay the small amount or pass a higher amount to someone else.",
    icon: <Flame className="w-12 h-12 text-red-500" />,
    color: "from-red-600/20 to-transparent",
  },
  {
    title: "The Multiplier",
    description: "Every time someone passes, the cost increases by 20%. Don't be the one caught when the timer hits zero!",
    icon: <Users className="w-12 h-12 text-purple-500" />,
    color: "from-purple-600/20 to-transparent",
  },
  {
    title: "Survival is Key",
    description: "Strategic passing is everything. Choose your targets wisely and keep the chain moving.",
    icon: <Timer className="w-12 h-12 text-amber-500" />,
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
        initial={{ opacity: 0, scale: 0.9, rotate: -1 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        className="relative w-full max-w-sm overflow-hidden bg-zinc-900 border-2 border-zinc-800 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.15)]"
      >
        {/* Animated Background */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${slides[currentSlide].color} transition-colors duration-700`} />
        
        <div className="relative p-10 flex flex-col items-center text-center">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="mb-8 p-6 bg-zinc-800/80 rounded-[2.5rem] border border-zinc-700 shadow-xl">
                {slides[currentSlide].icon}
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">
                {slides[currentSlide].title}
              </h2>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10 px-2">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="w-full flex flex-col gap-6">
            <div className="flex justify-center gap-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index === currentSlide ? "w-12 bg-red-500" : "w-4 bg-zinc-800"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-900/20 flex items-center justify-center gap-3 group"
            >
              {currentSlide === slides.length - 1 ? "I'm Ready" : "Continue"}
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
