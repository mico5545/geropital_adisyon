"use client";

import { useEffect } from "react";
import { kullaniciKaydet } from "@/kutuphane/oturum";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://bagdpvuujltcysniukry.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2RwdnV1dWpsdGN5c25pdWtyeSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA3NDc5MDAwLCJleHAiOjE4OTUxOTgwMDB9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

export default function IphoneGirisKontrol() {
  useEffect(() => {
    async function kontrolEt() {
      const params = new URLSearchParams(window.location.search);
      const kullaniciAdi = params.get("kullanici") || "";
      const sifre = params.get("sifre") || "";

      console.log("📱 iPhone Giriş Kontrol Başladı");
      console.log("👤 Kullanıcı Adı:", kullaniciAdi);

      return new Promise((resolve) => {
        const adres =
          SUPABASE_URL +
          "/rest/v1/kullanicilar?select=*&kullanici_adi=eq." +
          encodeURIComponent(kullaniciAdi.trim()) +
          "&sifre=eq." +
          encodeURIComponent(sifre.trim()) +
          "&aktif=eq.true";

        console.log("📡 API İsteği:", adres);

        const istek = new XMLHttpRequest();
        istek.open("GET", adres, true);
        istek.setRequestHeader("apikey", SUPABASE_KEY);
        istek.setRequestHeader("Authorization", "Bearer " + SUPABASE_KEY);
        istek.setRequestHeader("Content-Type", "application/json");

        istek.onload = function () {
          console.log("📩 API Status:", istek.status);

          if (istek.status >= 200 && istek.status < 300) {
            try {
              const sonuc = JSON.parse(istek.responseText);
              console.log("✅ Sonuç:", sonuc);

              if (Array.isArray(sonuc) && sonuc.length > 0) {
                const data = sonuc[0];
                console.log("✅ Kullanıcı Bulundu:", data.ad_soyad);

                kullaniciKaydet(data);

                if (data.rol === "hemsire") {
                  console.log("➡️ Hemşire Paneline Yönlendiriliyor...");
                  window.location.href = "/hemsire-paneli-hafif?kullaniciId=" + data.id;
                  return;
                }

                if (data.rol === "merkez") {
                  console.log("➡️ Merkez Paneline Yönlendiriliyor...");
                  window.location.href = "/merkez-paneli?kullaniciId=" + data.id;
                  return;
                }

                console.log("❌ Bilinmeyen Rol:", data.rol);
                window.location.href = "/iphone-giris?hata=rol";
                return;
              }

              console.log("❌ Kullanıcı Bulunamadı");
              window.location.href = "/iphone-giris?hata=1";
              resolve(null);
            } catch (e) {
              console.log("❌ JSON Parse Hatası:", e);
              window.location.href = "/iphone-giris?hata=1";
              resolve(null);
            }
          } else {
            console.log("❌ API Hatası Status:", istek.status);
            window.location.href = "/iphone-giris?hata=1";
            resolve(null);
          }
        };

        istek.onerror = function () {
          console.log("❌ Network Hatası");
          window.location.href = "/iphone-giris?hata=1";
          resolve(null);
        };

        istek.send();
      });
    }

    kontrolEt();
  }, []);

  return (
    <main style={{ padding: 30, fontFamily: "Arial" }}>
      <h2>Giriş kontrol ediliyor...</h2>
    </main>
  );
}