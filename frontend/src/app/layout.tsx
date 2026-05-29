import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NxFlow | Build Next Workflow",
  description: "NxFlow AI agent platform console",
  icons: {
    icon: "/nxflow/favicon.svg?v=nxflow-blue-light",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
