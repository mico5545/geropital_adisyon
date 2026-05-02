"use client";

import { useState } from "react";
import { supabase } from "@/kutuphane/supabase";

export default function VeritabaniTesti() {
  const [sonuc, setSonuc] = useState("");

  async function testHastaKaydiOlustur() {
    setSonuc("Hasta oluşturuluyor...");

    const { data: hasta, error: hastaHata } = await supabase
      .from("hastalar")
      .insert({
        hasta_adi: "Test Hasta",
        telefon: "0555 000 00 00",
        adres: "İzmir Test Adresi",
        notlar: "Veritabanı bağlantı testi",
      })
      .select()
      .single();

    if (hastaHata || !hasta) {
      console.log("Hasta hata:", hastaHata);
      setSonuc("Hasta oluşturulamadı: " + JSON.stringify(hastaHata));
      return;
    }

    setSonuc("Hasta oluşturuldu. ID: " + hasta.id);

    const { data: kullanici, error: kullaniciHata } = await supabase
      .from("kullanicilar")
      .select("*")
      .eq("kullanici_adi", "merkez")
      .single();

    if (kullaniciHata || !kullanici) {
      console.log("Kullanıcı hata:", kullaniciHata);
      setSonuc("Merkez kullanıcısı bulunamadı: " + JSON.stringify(kullaniciHata));
      return;
    }

    const { data: kayit, error: kayitHata } = await supabase
      .from("hasta_kayitlari")
      .insert({
        hasta_id: hasta.id,
        hemsire_id: null,
        acan_kullanici_id: kullanici.id,
        durum: "Aktif",
        odeme_durumu: "Tamamı Alınmadı",
        merkez_notu: "Test merkez notu",
        hemsire_notu: "",
        kapanis_notu: "",
      })
      .select()
      .single();

    if (kayitHata || !kayit) {
      console.log("Kayıt hata:", kayitHata);
      setSonuc("Hasta kaydı oluşturulamadı: " + JSON.stringify(kayitHata));
      return;
    }

    setSonuc(
      "BAŞARILI ✅ Hasta ve hasta kaydı veritabanına yazıldı. Hasta ID: " +
        hasta.id +
        " | Kayıt ID: " +
        kayit.id
    );
  }

  async function sonKayitlariGetir() {
    const { data, error } = await supabase
      .from("hasta_kayitlari")
      .select(`
        *,
        hastalar (*)
      `)
      .order("olusturma_tarihi", { ascending: false })
      .limit(5);

    if (error) {
      setSonuc("Kayıtlar çekilemedi: " + JSON.stringify(error));
      return;
    }

    setSonuc(JSON.stringify(data, null, 2));
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow p-6">
        <h1 className="text-3xl font-black text-slate-900">
          Veritabanı Testi
        </h1>

        <p className="text-slate-600 mt-2">
          Bu ekran Supabase’e gerçekten kayıt yazılıp yazılmadığını test eder.
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={testHastaKaydiOlustur}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black"
          >
            Test Hasta Kaydı Oluştur
          </button>

          <button
            onClick={sonKayitlariGetir}
            className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black"
          >
            Son Kayıtları Getir
          </button>
        </div>

        <pre className="mt-6 bg-slate-950 text-green-300 rounded-2xl p-4 overflow-auto text-sm whitespace-pre-wrap">
          {sonuc || "Henüz test yapılmadı."}
        </pre>
      </div>
    </main>
  );
}