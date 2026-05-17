import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { Providers } from "./providers";
import { RouteGuard } from "@/lib/auth/route-guard";
import { PermissionGuard } from "@/lib/auth/permission-guard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HR System - PT Hillga Indonesia",
  description: "Human Resources Management System for PT Hillga Indonesia",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%231E2A38' width='100' height='100' rx='20'/><text y='.9em' font-size='70' x='50%' text-anchor='middle'>H</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased">
        <Providers>
          <RouteGuard>
            <PermissionGuard>
              <ToastProvider>
                {children}
              </ToastProvider>
            </PermissionGuard>
          </RouteGuard>
        </Providers>
      </body>
    </html>
  );
}