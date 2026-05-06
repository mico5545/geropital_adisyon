"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/kutuphane/supabase";
import { safeStorage } from "@/kutuphane/storage";

export default function GirisSayfasi() {
  const router = useRouter();

  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    // Zaten login'se, giriş sayfasını gösterme - paneline yönlendir
    const kayitliKullanici = safeStorage.getItemLocal("kullanici");
    if (kayitliKullanici) {
      try {
        const kullanici = JSON.parse(kayitliKullanici);
        if (kullanici.rol === "merkez") {
          router.push("/merkez-paneli");
        } else if (kullanici.rol === "hemsire") {
          router.push("/hemsire-paneli");
        }
      } catch (e) {
        console.warn("Kullanıcı parse hatası:", e);
      }
    }
  }, [router]);

  async function girisYap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setHata("");
    setYukleniyor(true);

    try {
      // iOS 15 (iPhone 7) uyumluluğu: Supabase fetch timeout handle
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 saniye timeout

      const { data, error } = await supabase
        .from("kullanicilar")
        .select("*")
        .eq("kullanici_adi", kullaniciAdi.trim())
        .eq("sifre", sifre.trim())
        .eq("aktif", true)
        .single();

      clearTimeout(timeoutId);

      if (error || !data) {
        setYukleniyor(false);
        setHata("Kullanıcı adı veya şifre hatalı.");
        return;
      }

      // iOS private mode uyumluluğu - safeStorage ile verification
      const kullaniciJson = JSON.stringify(data);
      const saved = safeStorage.setItemLocal("kullanici", kullaniciJson);
      
      if (!saved) {
        setYukleniyor(false);
        setHata("Veri kaydı başarısız. Lütfen tarayıcı ayarlarını kontrol et.");
        return;
      }

      // Biraz bekle ve kontrol et (iOS 15 işlemi tamamlansın)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Session'ı verify et
      const verify = safeStorage.getItemLocal("kullanici");
      if (!verify) {
        setYukleniyor(false);
        setHata("Session kaydı başarısız. Lütfen tekrar deneyin.");
        return;
      }

      // 1 saniye loading göster sonra panele yönlendir
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (data.rol === "merkez") {
        // window.location yerine router.push (SPA optimization)
        router.push("/merkez-paneli");
        return;
      }

      if (data.rol === "hemsire") {
        router.push("/hemsire-paneli");
        return;
      }

      setYukleniyor(false);
      setHata("Kullanıcı rolü tanımsız.");
    } catch (err) {
      console.error("Giriş hatası:", err);
      setYukleniyor(false);
      setHata("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  return (
    <main className="min-h-screen kurumsal-arka-plan flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-md kurumsal-kart rounded-2xl sm:rounded-3xl p-6 sm:p-8">
        <div className="flex justify-center mb-3 sm:mb-5">
          <img
            src="/logo-geropital.png"
            alt="Geropital"
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#144a7b] text-center">
          Geropital İş Talimatı
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 text-center mt-2">
          Merkez ve hemşire giriş ekranı
        </p>

        <form onSubmit={girisYap} className="space-y-3 mt-6 sm:mt-8">
          <input
            value={kullaniciAdi}
            onChange={(e) => setKullaniciAdi(e.target.value)}
            className="w-full border border-slate-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-slate-900 text-sm"
            placeholder="Kullanıcı adı"
          />

          <input
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            className="w-full border border-slate-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-slate-900 text-sm"
            placeholder="Şifre"
          />

          {hata && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm">
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full kurumsal-buton rounded-lg sm:rounded-xl py-2 sm:py-3 font-black text-sm"
          >
            {yukleniyor ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-6 bg-[#f4f8fc] border border-[#144a7b]/10 rounded-xl p-4 text-sm text-slate-700">
          <p>
            <b>Merkez:</b> merkez / 1234
          </p>
          <p>
            <b>Hemşire:</b> hemsire / 1234
          </p>
        </div>
      </div>
    </main>
  );
}