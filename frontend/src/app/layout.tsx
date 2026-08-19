import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexFlow | Build Next Workflow",
  description: "NexFlow AI agent platform console",
  icons: {
    icon: "/nexflow/favicon.svg?v=nexflow-blue-light",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
