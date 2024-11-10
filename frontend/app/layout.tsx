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

import './globals.css';

import { ReactNode } from 'react';
import type { Metadata } from 'next';

import { getSession } from '@auth0/nextjs-auth0';
import { cookies } from 'next/headers'
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import Layout from '@/lib/hoagie-ui/Layout';
import Theme from '@/lib/hoagie-ui/Theme';
import '@/lib/hoagie-ui/Theme/theme.css';
import Nav from '@/lib/hoagie-ui/Nav';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Plan by Hoagie',
  description: 'Princeton, All In One',
  manifest: 'manifest.json',
};

async function fetchSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('appSession');
  if (!sessionCookie) {
    return null;
  }

  const session = await getSession();
  return session;
}

/**
 * Content Component
 * Fetches user data (real or mock) and renders the main layout.
 *
 * @param children - The child components to render within the layout.
 * @returns JSX Element representing the content area.
 */
async function Content({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const session = await fetchSession();
  const user = session?.user;

  const tabs = [
    { title: 'About', href: '/about' },
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Calendar', href: '/calendar' },
    { title: 'Contact Us', href: '/contact' },
  ];

  return (
    <Theme palette='yellow'>
      <Layout>
        <Nav name='plan' tabs={tabs} user={user} />
        {children}
      </Layout>
    </Theme>
  );
}

/**
 * RootLayout Component
 * Wraps the entire application with necessary providers and layouts.
 *
 * @param children - The child components to render within the layout.
 * @returns JSX Element representing the root HTML structure.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await fetchSession();
  return (
    <html lang='en'>
      <UserProvider user={session?.user}>
        <body className={`${inter.className} antialiased`}>
          <Content>{children}</Content>
          <Analytics />
          <SpeedInsights />
        </body>
      </UserProvider>
    </html>
  );
}
