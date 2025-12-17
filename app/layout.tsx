import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { GithubProvider } from "@/lib/context/githubData";
import { TeamsProvider } from "@/lib/context/teamsContext";
import { TeamDataProvider } from "@/lib/context/teamDataContext";
import { AuthProvider } from "@/lib/context/authContext";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hy-vee Activity Tracker",
  description: "Team-wise developer performance insights",
  generator: "v0.app",
  icons: {
    icon: "/brand.png",
    apple: "/brand.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/brand.png" type="image/png" />
      </head>
      <AuthProvider>
        <GithubProvider token={process.env.NEXT_PUBLIC_GITHUB_TOKEN}>
          <TeamsProvider>
            <TeamDataProvider>
              <body className={`font-sans antialiased`}>
                {children}
                <Analytics />
              </body>
            </TeamDataProvider>
          </TeamsProvider>
        </GithubProvider>
      </AuthProvider>
    </html>
  );
}
