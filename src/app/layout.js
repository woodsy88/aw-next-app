import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: {
    template: '%s | App Sandbox',
    default: 'App Sandbox',
  },
  keywords: ["JavaScript", "Product", "Next.js", "React", "Tailwind", "Shadcn", "AI", "OpenAI", "ChatGPT", "LangChain"],
  openGraph: {
    images: 'https://spacedventure-marketing.s3.amazonaws.com/Meta-Image+(2).png',
  },   
  description: 'Building Apps for fun and for work',
  icons: {
    icon: [
      {
        url: '/images/favicon.png',
        href: '/images/favicon.png',
      },
    ]
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
