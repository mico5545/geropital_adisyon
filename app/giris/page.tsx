"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAl } from "@/kutuphane/supabase";

export default function GirisSayfasi() {
  const router = useRouter();

  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  async function girisYap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setHata("");
    setYukleniyor(true);

    const { data, error } = await supabaseAl()
      .from("kullanicilar")
      .select("*")
      .eq("kullanici_adi", kullaniciAdi)
      .eq("sifre", sifre)
      .eq("aktif", true)
      .single();

    setYukleniyor(false);

    if (error || !data) {
      setHata("Kullanıcı adı veya şifre hatalı.");
      return;
    }

    localStorage.setItem("kullanici", JSON.stringify(data));

    if (data.rol === "merkez") {
      router.push("/merkez-paneli");
      return;
    }

    if (data.rol === "hemsire") {
      router.push("/hemsire-paneli");
      return;
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">
            Geropital Adisyon
          </h1>

          <p className="text-slate-600 mt-2">
            Merkez ve hemşire giriş sistemi
          </p>
        </div>

        <form onSubmit={girisYap} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Kullanıcı Adı
            </label>

            <input
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              placeholder="kullanıcı adı"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Şifre
            </label>

            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              placeholder="şifre"
            />
          </div>

          {hata && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-black"
          >
            {yukleniyor ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-600 bg-slate-50 rounded-xl p-4 space-y-1">
          <p className="font-bold">Hazır Kullanıcılar</p>
          <p>merkez / 1234</p>
          <p>hemsireelif / 1234</p>
          <p>hemsirezeynep / 1234</p>
          <p>hemsiremerve / 1234</p>
        </div>
      </div>
    </main>
  );
}