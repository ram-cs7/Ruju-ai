import { EB_Garamond, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const editorial = Newsreader({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const garamond = EB_Garamond({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-plex",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Ruju.ai | Multi-Agent Verification Pipeline",
  description: "The B2B Anti-Hallucination Engine. Find Proof. Verify Facts. Build Trust.",
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'Ruju.ai',
    description: 'The Anti-Hallucination Engine. Verify AI claims directly against your source documents.',
    url: 'https://ruju.ai',
    siteName: 'Ruju.ai',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${editorial.variable} ${garamond.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
