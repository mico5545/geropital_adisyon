"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RouteTransition() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  // Sayfalar arası geçişlerde loading göster
  useEffect(() => {
    const handleStart = () => setIsLoading(true);

    // Route change interceptor
    window.addEventListener("beforeunload", handleStart);

    return () => {
      window.removeEventListener("beforeunload", handleStart);
    };
  }, []);

  // Link tıklamalarını yakala (a[href] elements)
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a[href]") as HTMLAnchorElement;

      if (!target) return;

      const href = target.getAttribute("href");

      // Dış linkler, hash linkler, file'lar için loading gösterme
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("file://") ||
        href.startsWith("mailto:")
      ) {
        return;
      }

      // İç link ise loading göster
      if (href !== pathname) {
        setIsLoading(true);
        
        // 0.6 saniye sonra sayfaya git (loading animation görmesi için)
        setTimeout(() => {
          if (target.getAttribute("href") === href) {
            window.location.href = href;
          }
        }, 600);

        // Default link behavior'ı iptal et
        e.preventDefault();
      }
    };

    document.addEventListener("click", handleLinkClick);

    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white z-[10000] flex items-center justify-center pointer-events-auto">
      <div className="kurumsal-kart rounded-3xl p-10 text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo-geropital.png"
            alt="Geropital"
            className="h-16 w-auto object-contain"
          />
        </div>

        <div className="flex justify-center gap-1 text-4xl font-black tracking-widest text-[#144a7b]">
          {["G", "E", "R", "O", "P", "İ", "T", "A", "L"].map((harf, index) => (
            <span
              key={index}
              className="daktilo-harf"
              style={{ animationDelay: `${index * 130}ms` }}
            >
              {harf}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-500">
          Sayfa hazırlanıyor...
        </p>
      </div>
    </div>
  );
}
