import type { Metadata } from "next";
import { Sidebar } from "@/components/ui/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assessment Recorder - LLM・SaaSアセスメント評価システム",
  description: "LLMやSaaSアプリケーションのセキュリティ・コンプライアンス評価を自動化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
