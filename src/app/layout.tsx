import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '稻田蛙声学院',
  description: '只做有利于医患的诊疗技术传播',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
