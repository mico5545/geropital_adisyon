"use client";

import KurumsalLogo from "./KurumsalLogo";
import Link from "next/link";

type NavButton = {
  label: string;
  href?: string;
  onClick?: () => void;
  style?: "primary" | "secondary" | "danger" | "notification";
  badge?: number;
  icon?: string;
};

type KurumsalNavbarProps = {
  title: string;
  description?: string;
  buttons?: NavButton[];
  sesAktif?: boolean;
  onSesToggle?: () => void;
  bildirimSayisi?: number;
  onCikis?: () => void;
};

export default function KurumsalNavbar({
  title,
  description,
  buttons = [],
  sesAktif = false,
  onSesToggle,
  bildirimSayisi = 0,
  onCikis,
}: KurumsalNavbarProps) {
  return (
    <header className="bg-gradient-to-r from-[#144a7b] via-[#1a5a8f] to-[#0f3b64] shadow-xl border-b-4 border-[#0a2a52]">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Sol: Logo ve Başlık */}
          <div className="flex items-center gap-5">
            <div className="bg-white/95 rounded-2xl p-3 shadow-lg hover:shadow-xl transition-shadow duration-300 backdrop-blur-sm">
              <KurumsalLogo />
            </div>
            <div className="border-l-2 border-white/30 pl-5">
              <h1 className="text-3xl font-black text-white tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-blue-100 mt-1 font-medium">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Sağ: Butonlar */}
          <div className="flex flex-wrap gap-2 lg:justify-end items-center">
            {/* Ses Butonu */}
            {onSesToggle && (
              <button
                onClick={onSesToggle}
                className="group bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border border-white/20 hover:border-white/40 backdrop-blur-sm"
              >
                {sesAktif ? "🔊 Ses Aktif" : "🔕 Sesi Aç"}
              </button>
            )}

            {/* Bildirim Butonu */}
            {bildirimSayisi !== undefined && (
              <a
                href="/bildirimler"
                className="group relative bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-600 hover:to-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  Bildirimler
                  {bildirimSayisi > 0 && (
                    <span className="bg-red-700 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {bildirimSayisi}
                    </span>
                  )}
                </span>
              </a>
            )}

            {/* Dinamik Butonlar */}
            {buttons.map((btn, idx) => {
              const baseClasses =
                "px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300";

              const styleClasses = {
                primary:
                  "bg-[#144a7b] text-white hover:bg-[#0f3b64] shadow-md hover:shadow-lg",
                secondary:
                  "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm",
                danger:
                  "bg-gradient-to-r from-red-600/70 to-red-700/70 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl border border-red-500/30",
                notification:
                  "bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl",
              };

              const classes = `${baseClasses} ${styleClasses[btn.style || "primary"]}`;

              const content = (
                <span className="flex items-center gap-2">
                  {btn.icon && <span>{btn.icon}</span>}
                  {btn.label}
                  {btn.badge && btn.badge > 0 && (
                    <span className="bg-red-700 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {btn.badge}
                    </span>
                  )}
                </span>
              );

              return btn.href ? (
                <a key={idx} href={btn.href} className={classes}>
                  {content}
                </a>
              ) : (
                <button key={idx} onClick={btn.onClick} className={classes}>
                  {content}
                </button>
              );
            })}

            {/* Çıkış Butonu */}
            {onCikis && (
              <button
                onClick={onCikis}
                className="bg-gradient-to-r from-red-600/70 to-red-700/70 hover:from-red-700 hover:to-red-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl border border-red-500/30"
              >
                🚪 Çıkış
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
