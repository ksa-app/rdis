import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OverseasERP - Recruitment Management SaaS",
  description: "Complete ERP solution for overseas recruitment agencies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
