import "./globals.css";
import { Web3Providers } from "./providers";

export const metadata = {
  title: "PayOrPass — Social Payment Game",
  description: "Turn simple payments into an interactive, social, and behavioral experience on Celo.",
  other: {
    "talentapp:project_verification": "14bb8db63dd41e394b68793a387610beb4ebb74c85b7f611607bdf55e36d58613f1afa7fa3b307b0ae79eb8b9933cbe2494ebb6a85badfa8f1b9406817e4ab63"
  },
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
