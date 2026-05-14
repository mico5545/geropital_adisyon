"use client";

import { useEffect } from "react";
import { supabase } from "@/kutuphane/supabase";
import { kullaniciKaydet } from "@/kutuphane/oturum";

export default function IphoneGirisKontrol() {
  useEffect(() => {
    async function kontrolEt() {
      const params = new URLSearchParams(window.location.search);

      const kullaniciAdi = params.get("kullanici") || "";
      const sifre = params.get("sifre") || "";

      const { data, error } = await supabase
        .from("kullanicilar")
        .select("*")
        .eq("kullanici_adi", kullaniciAdi.trim())
        .eq("sifre", sifre.trim())
        .eq("aktif", true)
        .single();

      if (error || !data) {
        window.location.href = "/iphone-giris?hata=1";
        return;
      }

      kullaniciKaydet(data);

      if (data.rol === "hemsire") {
        window.location.href = "/hemsire-paneli-hafif";
        return;
      }

      if (data.rol === "merkez") {
        window.location.href = "/merkez-paneli";
        return;
      }

      window.location.href = "/iphone-giris?hata=rol";
    }

    kontrolEt();
  }, []);

  return (
    <main style={{ padding: 30, fontFamily: "Arial" }}>
      <h2>Giriş kontrol ediliyor...</h2>
    </main>
  );
}