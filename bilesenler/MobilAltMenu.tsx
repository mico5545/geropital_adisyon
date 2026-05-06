"use client";

import Link from "next/link";

export default function MobilAltMenu() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:hidden">
      <div className="grid grid-cols-4">
        <Link
          href="/merkez-paneli"
          className="p-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          📊 Panel
        </Link>

        <Link
          href="/bildirimler"
          className="p-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          🔔 Bildirim
        </Link>

        <Link
          href="/gunluk-saha-plani"
          className="p-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          📋 Plan
        </Link>

        <Link
          href="/kapatilan-hasta-kayitlari"
          className="p-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          📁 Arşiv
        </Link>
      </div>
    </div>
  );
}
