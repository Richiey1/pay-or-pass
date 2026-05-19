import "./globals.css";
import { Web3Providers } from "./providers";

export const metadata = {
  title: "PayOrPass — Social Payment Game",
  description: "Turn simple payments into an interactive, social, and behavioral experience on Celo.",
  icons: {
    icon: "/paynpass-logo.svg",
    apple: "/paynpass-logo.png",
  },
  openGraph: {
    title: "PayOrPass — Social Payment Game",
    description: "The social mini-game of pressure and strategy. Pay to end the chain or pass it with a 20% increase.",
    images: [{ url: "/paynpass-logo.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
