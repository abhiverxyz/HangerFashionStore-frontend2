import type { Metadata } from "next";
import { Inter, Playfair_Display, Bungee_Spice, Bangers, Knewave, Ultra } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { StorageAccessProvider } from "@/lib/contexts/StorageAccessContext";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
import { CartProvider } from "@/lib/contexts/CartContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const bungeeSpice = Bungee_Spice({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bungee-spice",
  display: "swap",
});

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
  display: "swap",
});

const knewave = Knewave({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-knewave",
  display: "swap",
});

const ultra = Ultra({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ultra",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hanger Fashion",
  description: "Fashion marketplace – Admin, Brands, Users",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${bungeeSpice.variable} ${bangers.variable} ${knewave.variable} ${ultra.variable}`}>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <AuthProvider>
          <StorageAccessProvider>
            <WishlistProvider>
              <CartProvider>{children}</CartProvider>
            </WishlistProvider>
          </StorageAccessProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
