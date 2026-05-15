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

      console.log("📡 API İsteği Başlıyor:", adres);

      const istek = new XMLHttpRequest();

      istek.open("GET", adres, true);
      istek.setRequestHeader("apikey", SUPABASE_KEY);
      istek.setRequestHeader("Authorization", "Bearer " + SUPABASE_KEY);
      istek.setRequestHeader("Content-Type", "application/json");

      istek.onload = function () {
        console.log("📩 API Yanıt Status:", istek.status);
        console.log("📨 API Yanıt Metni:", istek.responseText);
        
        if (istek.status >= 200 && istek.status < 300) {
          try {
            const sonuc = JSON.parse(istek.responseText);
            console.log("✅ API Yanıtı Başarılı:", sonuc);
            console.log("🔍 Sonuç Türü:", typeof sonuc, "Array mi?", Array.isArray(sonuc));

            if (Array.isArray(sonuc) && sonuc.length > 0) {
              console.log("📋 İlk Kayıt:", sonuc[0]);
              console.log("👤 Kullanıcı Bulundu:", sonuc[0].ad_soyad, "Rol:", sonuc[0].rol);
              resolve(sonuc[0]);
              return;
            }

            console.log("❌ Sonuç Boş veya Array Değil");
            resolve(null);
          } catch (e) {
            console.log("❌ JSON Parse Hatası:", e);
            console.log("❌ Hata Detayı:", e instanceof Error ? e.message : String(e));
            resolve(null);
          }
        } else {
          console.log("❌ API Hatası Status:", istek.status, "Yanıt:", istek.responseText);
          resolve(null);
        }
      };

      istek.onerror = function () {
        console.log("❌ Network Hatası");
        resolve(null);
      };

      istek.send();
    });
  }

  function paneleYonlendir(kullanici: Kullanici) {
    console.log("🔐 Kullanıcı Oturumu Kaydediliyor:", kullanici.ad_soyad);
    
    try {
      kullaniciKaydet(kullanici);
      console.log("✅ localStorage'a yazıldı");
      console.log("✅ Cookie'ye yazıldı");
    } catch (e) {
      console.log("⚠️ Storage Hatası:", e);
    }

    console.log("🎯 Rol:", kullanici.rol);

    if (kullanici.rol === "merkez") {
      console.log("➡️ Merkez Paneline Yönlendiriliyor...");
      window.location.href = "/merkez-paneli?kullaniciId=" + kullanici.id;
      return;
    }

    if (kullanici.rol === "hemsire") {
      console.log("➡️ Hemşire Paneline Yönlendiriliyor...");
      window.location.href = "/hemsire-paneli-hafif?kullaniciId=" + kullanici.id;
      return;
    }

    console.log("❌ Bilinmeyen Rol:", kullanici.rol);
    setHata("Kullanıcı rolü tanımsız.");
  }

  async function girisYap() {
    if (yukleniyor) return;

    setHata("");
    console.log("🔑 Giriş Denemesi Başladı");

    const temizKullaniciAdi = kullaniciAdi.trim();
    const temizSifre = sifre.trim();

    if (!temizKullaniciAdi || !temizSifre) {
      console.log("⚠️ Boş Alan - Kullanıcı Adı:", temizKullaniciAdi, "Şifre:", temizSifre);
      setHata("Kullanıcı adı ve şifre zorunludur.");
      return;
    }

    console.log("📝 Kullanıcı Adı:", temizKullaniciAdi);
    setYukleniyor(true);

    const kullanici = await eskiUyumluKullaniciSorgula(
      temizKullaniciAdi,
      temizSifre
    );

    setYukleniyor(false);

    if (!kullanici) {
      console.log("❌ Kullanıcı Bulunamadı veya Şifre Hatalı");
      setHata("Kullanıcı adı veya şifre hatalı.");
      return;
    }

    console.log("✅ Giriş Başarılı");
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
          <button
            onClick={() => {
              // Merkez test giriş
              const merkez = {
                id: "merkez-test",
                kullanici_adi: "merkez",
                sifre: "1234",
                ad_soyad: "Merkez Yöneticisi",
                rol: "merkez" as const,
                aktif: true
              };
              kullaniciKaydet(merkez);
              window.location.href = "/merkez-paneli?kullaniciId=" + merkez.id;
            }}
            className="w-full kurumsal-buton rounded-xl py-3 font-black"
          >
            Merkez Paneline Giriş
          </button>

          <button
            onClick={() => {
              // Hemşire test giriş
              const hemsire = {
                id: "hemsire-test",
                kullanici_adi: "hemsire",
                sifre: "1234",
                ad_soyad: "Test Hemşire",
                rol: "hemsire" as const,
                aktif: true
              };
              kullaniciKaydet(hemsire);
              window.location.href = "/hemsire-paneli-hafif?kullaniciId=" + hemsire.id;
            }}
            className="w-full bg-emerald-600 text-white px-5 py-3 rounded-xl font-black transition hover:bg-emerald-700"
          >
            Hemşire Paneline Giriş
          </button>

          <a
            href="/iphone-giris"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 14,
              color: "#144a7b",
              fontWeight: "bold",
              textDecoration: "underline",
            }}
          >
            Hemşire Özel Girişi
          </a>
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