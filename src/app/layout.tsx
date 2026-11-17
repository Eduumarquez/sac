import type { Metadata, Viewport } from "next";
import { Cabecalho } from "@/components/Cabecalho";
import { Avisos } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SAC · Sistema para academias", template: "%s · SAC" },
  description: "O sistema que faz o aluno ficar: da matrícula ao acompanhamento com personal e nutricionista.",
  icons: { apple: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icone-192.png` },
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
};

export const viewport: Viewport = { themeColor: "#1d4ed8", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Pular para o conteúdo</a>
        <Cabecalho />
        <div id="conteudo">{children}</div>
        <Avisos />
      </body>
    </html>
  );
}
