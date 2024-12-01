/**
 * @overview Root layout component for the Hoagie Plan app. Styles apply to all children.
 *
 * Copyright © 2021-2024 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/plan/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import "./globals.css";

import { ReactNode } from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { getSession } from "@auth0/nextjs-auth0";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";

import Content from "@/app/content";
import "@/lib/hoagie-ui/Theme/theme.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plan by Hoagie",
  description: "Princeton, All In One",
  manifest: "manifest.json",
};

async function fetchSession() {
  const cookieStore = cookies();

  // TODO: I think this is handled in middleware.ts and should be removed -windsor
  const sessionCookie = cookieStore.get("appSession");
  if (!sessionCookie) {
    return null;
  }

  const session = await getSession();
  return session;
}

/**
 * RootLayout server side
 * Wraps the entire application with necessary providers and layouts.
 *
 * @param children - The child components to render within the layout.
 * @returns JSX Element representing the root HTML structure.
 */
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await fetchSession();

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <UserProvider user={session?.user}>
          <Content user={session?.user}>{children}</Content>
        </UserProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
