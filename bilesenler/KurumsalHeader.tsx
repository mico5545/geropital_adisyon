"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import KurumsalLogo from "./KurumsalLogo";

type LinkItem = {
  href: string;
  label: string;
  vurgu?: "ana" | "acik" | "amber" | "koyu";
};

type KurumsalHeaderProps = {
  baslik?: string;
  aciklama?: string;
  linkler?: LinkItem[];
  sagAlan?: React.ReactNode;
};

export default function KurumsalHeader({
  baslik,
  aciklama,
  linkler = [],
  sagAlan,
}: KurumsalHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="kurumsal-kart kurumsal-hover rounded-none border-b border-[#144a7b]/10 p-5 print-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {(baslik || aciklama) && (
          <div className="flex flex-col gap-1 mb-2">
            {baslik && <h1 className="text-2xl font-bold text-[#144a7b]">{baslik}</h1>}
            {aciklama && <p className="text-sm text-gray-600">{aciklama}</p>}
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 flex-1">
          <KurumsalLogo />
          <div className="flex gap-2 w-full">
            {linkler.map((link) => {
              const isActive = pathname === link.href;
              let className =
                "flex-1 px-4 py-2 rounded-xl font-bold transition hover:-translate-y-0.5 flex items-center justify-center text-center";

              if (isActive) {
                className += " kurumsal-buton";
              } else if (link.vurgu === "ana") {
                className += " kurumsal-buton";
              } else if (link.vurgu === "amber") {
                className += " bg-amber-100 text-amber-900 hover:bg-amber-200";
              } else if (link.vurgu === "koyu") {
                className += " bg-slate-900 text-white hover:bg-slate-800";
              } else {
                className += " kurumsal-acik-buton";
              }

              return (
                <Link key={link.href} href={link.href} className={className}>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          {sagAlan}
        </div>
        </div>
      </div>
    </header>
  );
}
