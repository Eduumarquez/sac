import type { Metadata, Viewport } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAC",
  description: "O sistema que faz o aluno ficar: da matrícula ao acompanhamento com personal e nutricionista.",
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
};

export const viewport: Viewport = { themeColor: "#0f766e" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <Cabecalho />
        {children}
      </body>
    </html>
  );
}
