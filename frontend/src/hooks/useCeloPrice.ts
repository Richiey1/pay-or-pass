import { useState, useEffect } from "react";

export function useCeloPrice() {
  const [celoPrice, setCeloPrice] = useState<number>(0.62); // Fallback

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=usd");
        if (response.ok) {
          const data = await response.json();
          if (data?.celo?.usd) {
            setCeloPrice(data.celo.usd);
          }
        }
      } catch (error) {
        console.error("Failed to fetch CELO price:", error);
      }
    };

    fetchPrice();
    // Refetch every 60 seconds
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return celoPrice;
}
