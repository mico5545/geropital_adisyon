"use client";

import { useState } from "react";
import { supabase } from "@/kutuphane/supabase";

export default function GirisSayfasi() {
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  function guvenliYonlendir(rol: string) {
    if (rol === "merkez") {
      window.location.replace("/merkez-paneli");
      return;
    }

    if (rol === "hemsire") {
      window.location.replace("/hemsire-paneli");
      return;
    }

    setHata("Kullanıcı rolü tanımsız.");
  }

  async function girisYap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setHata("");
    setYukleniyor(true);

    const temizKullaniciAdi = kullaniciAdi.trim();
    const temizSifre = sifre.trim();

    const { data, error } = await supabase
      .from("kullanicilar")
      .select("*")
      .eq("kullanici_adi", temizKullaniciAdi)
      .eq("sifre", temizSifre)
      .eq("aktif", true)
      .single();

    setYukleniyor(false);

    if (error || !data) {
      setHata("Kullanıcı adı veya şifre hatalı.");
      return;
    }

    try {
      localStorage.setItem("kullanici", JSON.stringify(data));
    } catch {
      setHata("Tarayıcı oturum bilgisi kaydedemedi. Safari ayarlarını kontrol edin.");
      return;
    }

    setTimeout(() => {
      guvenliYonlendir(data.rol);
    }, 100);
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

        <form onSubmit={girisYap} className="space-y-4 mt-8">
          <input
            value={kullaniciAdi}
            onChange={(e) => setKullaniciAdi(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
            placeholder="Kullanıcı adı"
            autoComplete="username"
          />

          <input
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
            placeholder="Şifre"
            autoComplete="current-password"
          />

          {hata && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full kurumsal-buton rounded-xl py-3 font-black"
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