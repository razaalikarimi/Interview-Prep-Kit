import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Interview Prep Kit — Enterprise Interview Preparation',
  description:
    'Enterprise-grade interview preparation platform with research-backed questions, role coverage verification, study schedules, and retention tracking.',
  keywords: ['interview prep', 'enterprise', 'flashcards', 'technical interview', 'coverage analysis'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-[#F8F9FB] text-gray-900 antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
