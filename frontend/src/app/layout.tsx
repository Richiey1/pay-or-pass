import "./globals.css";

export const metadata = {
  title: "PayOrPass",
  description: "Social payment game on Celo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
