import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Poppins, Geist } from "next/font/google";
import { Toaster } from "react-hot-toast";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { FontProvider } from "@/components/font-provider";
import { cn } from "@/lib/utils";

import { ClerkAxiosInterceptor } from "@/components/ClerkAxiosInterceptor";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn("antialiased", inter.variable, poppins.variable, "font-sans", geist.variable)}
      >
        <body className="relative min-h-screen antialiased selection:bg-primary/30 transition-all duration-300">
          <ThemeProvider>
            <FontProvider>
              <ClerkAxiosInterceptor>
                <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
                  <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/30 opacity-50 blur-[100px]"></div>
                </div>
                {children}
                <Toaster position="bottom-right" reverseOrder={false} />
              </ClerkAxiosInterceptor>
            </FontProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
