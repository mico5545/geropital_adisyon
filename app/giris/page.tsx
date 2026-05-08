"use client";

import { useState } from "react";
import { kullaniciKaydet } from "@/kutuphane/oturum";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://bagdpvuujltcysniukry.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2RwdnV1dWpsdGN5c25pdWtyeSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA3NDc5MDAwLCJleHAiOjE4OTUxOTgwMDB9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

type Kullanici = {
  id: string;
  kullanici_adi: string;
  sifre: string;
  ad_soyad: string;
  rol: "merkez" | "hemsire";
  aktif: boolean;
};

export default function GirisSayfasi() {
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  function eskiUyumluKullaniciSorgula(
    kullaniciAdiDegeri: string,
    sifreDegeri: string
  ): Promise<Kullanici | null> {
    return new Promise((resolve) => {
      const adres =
        SUPABASE_URL +
        "/rest/v1/kullanicilar?select=*&kullanici_adi=eq." +
        encodeURIComponent(kullaniciAdiDegeri) +
        "&sifre=eq." +
        encodeURIComponent(sifreDegeri) +
        "&aktif=eq.true";

      const istek = new XMLHttpRequest();

      istek.open("GET", adres, true);
      istek.setRequestHeader("apikey", SUPABASE_KEY);
      istek.setRequestHeader("Authorization", "Bearer " + SUPABASE_KEY);
      istek.setRequestHeader("Content-Type", "application/json");

      istek.onload = function () {
        if (istek.status >= 200 && istek.status < 300) {
          try {
            const sonuc = JSON.parse(istek.responseText);

            if (Array.isArray(sonuc) && sonuc.length > 0) {
              resolve(sonuc[0]);
              return;
            }

            resolve(null);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      istek.onerror = function () {
        resolve(null);
      };

      istek.send();
    });
  }

  function paneleYonlendir(kullanici: Kullanici) {
    try {
      kullaniciKaydet(kullanici);
    } catch {}

    if (kullanici.rol === "merkez") {
      window.location.href = "/merkez-paneli?kullaniciId=" + kullanici.id;
      return;
    }

    if (kullanici.rol === "hemsire") {
      window.location.href = "/hemsire-paneli-hafif?kullaniciId=" + kullanici.id;
      return;
    }

    setHata("Kullanıcı rolü tanımsız.");
  }

  async function girisYap() {
    if (yukleniyor) return;

    setHata("");

    const temizKullaniciAdi = kullaniciAdi.trim();
    const temizSifre = sifre.trim();

    if (!temizKullaniciAdi || !temizSifre) {
      setHata("Kullanıcı adı ve şifre zorunludur.");
      return;
    }

    setYukleniyor(true);

    const kullanici = await eskiUyumluKullaniciSorgula(
      temizKullaniciAdi,
      temizSifre
    );

    setYukleniyor(false);

    if (!kullanici) {
      setHata("Kullanıcı adı veya şifre hatalı.");
      return;
    }

    paneleYonlendir(kullanici);
  }

  return (
    <main className="min-h-screen kurumsal-arka-plan flex items-center justify-center p-5">
      <div className="w-full max-w-md kurumsal-kart rounded-3xl p-8">
        <div className="flex justify-center mb-5">
          <img
            src="/logo-geropital.png"
            alt="Geropital"
            className="h-16 w-auto object-contain"
          />
        </div>

        <h1 className="text-3xl font-black text-[#144a7b] text-center">
          Geropital İş Talimatı
        </h1>

        <p className="text-slate-600 text-center mt-2">
          Merkez ve hemşire giriş ekranı
        </p>

        <div className="space-y-4 mt-8">
          <input
            value={kullaniciAdi}
            onChange={(e) => setKullaniciAdi(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
            placeholder="Kullanıcı adı"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />

          <input
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
            placeholder="Şifre"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                girisYap();
              }
            }}
          />

          {hata && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {hata}
            </div>
          )}

          <button
            type="button"
            onClick={girisYap}
            disabled={yukleniyor}
            className="w-full kurumsal-buton rounded-xl py-3 font-black"
          >
            {yukleniyor ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </div>

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