"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/kutuphane/supabase";

export default function GirisSayfasi() {
  const router = useRouter();

  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function girisYap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setHata("");
    setYukleniyor(true);

    const { data, error } = await supabase
      .from("kullanicilar")
      .select("*")
      .eq("kullanici_adi", kullaniciAdi.trim())
      .eq("sifre", sifre.trim())
      .eq("aktif", true)
      .single();

    setYukleniyor(false);

    if (error || !data) {
      setHata("Kullanıcı adı veya şifre hatalı.");
      return;
    }

    // iOS private mode'da localStorage erişim yok - try/catch ile handle et
    try {
      localStorage.setItem("kullanici", JSON.stringify(data));
    } catch (e) {
      // localStorage kullanılamıyor, sessionStorage'a kaydet
      try {
        sessionStorage.setItem("kullanici", JSON.stringify(data));
      } catch (e2) {
        console.warn("localStorage ve sessionStorage kullanılamıyor");
      }
    }

    if (data.rol === "merkez") {
      router.push("/merkez-paneli");
      return;
    }

    if (data.rol === "hemsire") {
      router.push("/hemsire-paneli");
      return;
    }

    setHata("Kullanıcı rolü tanımsız.");
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