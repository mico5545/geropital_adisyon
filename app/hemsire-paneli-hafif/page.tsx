"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/kutuphane/supabase";
import { kullaniciOku, oturumTemizle } from "@/kutuphane/oturum";

type Kullanici = {
  id: string;
  ad_soyad: string;
  rol: "merkez" | "hemsire";
};

type Hizmet = {
  id: string;
  hizmet_adi: string;
  fiyat: number;
  aciklama: string | null;
};

type HastaBilgisi = {
  hasta_adi: string;
  telefon: string | null;
  adres: string | null;
};

type HastaKaydi = {
  id: string;
  durum: string;
  odeme_durumu: string;
  merkez_notu: string | null;
  hemsire_notu: string | null;
  plan_tarihi: string | null;
  plan_saati: string | null;
  olusturma_tarihi: string;
  hastalar: HastaBilgisi | HastaBilgisi[] | null;
  hasta_hizmetleri: {
    id: string;
    hizmet_adi: string;
    hizmet_tipi: string;
    adet: number;
    birim_fiyat: number;
    aciklama: string | null;
  }[];
};

const odemeSecenekleri = [
  "Kredi Kartı ile Tamamı Alındı",
  "Nakit Tamamı Alındı",
  "EFT / Havale Yapılacak",
  "Tamamı Alınmadı",
];

export default function HemsirePaneliHafif() {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [kayitlar, setKayitlar] = useState<HastaKaydi[]>([]);
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [seciliKayit, setSeciliKayit] = useState<HastaKaydi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [seciliHizmetId, setSeciliHizmetId] = useState("");
  const [hizmetFiyat, setHizmetFiyat] = useState("");
  const [hizmetAciklama, setHizmetAciklama] = useState("");
  const [odemeDurumu, setOdemeDurumu] = useState("Tamamı Alınmadı");
  const [odemeAciklama, setOdemeAciklama] = useState("");
  const [hemsireNotu, setHemsireNotu] = useState("");

  useEffect(() => {
    async function baslat() {
      let aktifKullanici = kullaniciOku();

      if (!aktifKullanici) {
        const arama = window.location.search || "";
        const eslesen = arama.match(/kullaniciId=([^&]+)/);
        const kullaniciId = eslesen ? decodeURIComponent(eslesen[1]) : "";

        if (!kullaniciId) {
          window.location.href = "/giris";
          return;
        }

        const { data, error } = await supabase
          .from("kullanicilar")
          .select("*")
          .eq("id", kullaniciId)
          .eq("aktif", true)
          .single();

        if (error || !data) {
          window.location.href = "/giris";
          return;
        }

        aktifKullanici = data;
      }

      if (aktifKullanici.rol !== "hemsire") {
        window.location.href = "/merkez-paneli";
        return;
      }

      setKullanici(aktifKullanici);
      verileriGetir(aktifKullanici.id);
    }

    baslat();
  }, []);

  async function verileriGetir(hemsireId: string) {
    setYukleniyor(true);

    const { data: kayitData, error: kayitHata } = await supabase
      .from("hasta_kayitlari")
      .select(`
        id,
        durum,
        odeme_durumu,
        merkez_notu,
        hemsire_notu,
        plan_tarihi,
        plan_saati,
        olusturma_tarihi,
        hastalar (
          hasta_adi,
          telefon,
          adres
        ),
        hasta_hizmetleri (
          id,
          hizmet_adi,
          hizmet_tipi,
          adet,
          birim_fiyat,
          aciklama
        )
      `)
      .eq("hemsire_id", hemsireId)
      .neq("durum", "Kapalı")
      .order("plan_tarihi", { ascending: true, nullsFirst: false })
      .order("plan_saati", { ascending: true, nullsFirst: false });

    const { data: hizmetData, error: hizmetHata } = await supabase
      .from("hizmet_katalogu")
      .select("id, hizmet_adi, fiyat, aciklama")
      .eq("aktif", true)
      .order("hizmet_adi", { ascending: true });

    if (kayitHata) {
      alert("Hasta kayıtları alınamadı.");
      console.log(kayitHata);
    }

    if (hizmetHata) {
      console.log(hizmetHata);
    }

    setKayitlar((kayitData as unknown as HastaKaydi[]) || []);
    setHizmetler((hizmetData as Hizmet[]) || []);
    setYukleniyor(false);
  }

  function hastaBilgisiGetir(kayit: HastaKaydi) {
    if (Array.isArray(kayit.hastalar)) {
      return kayit.hastalar[0] || null;
    }

    return kayit.hastalar || null;
  }

  function hastaAdiGetir(kayit: HastaKaydi) {
    const hasta = hastaBilgisiGetir(kayit);
    return hasta && hasta.hasta_adi ? hasta.hasta_adi : "Hasta adı yok";
  }

  function hastaTelefonGetir(kayit: HastaKaydi) {
    const hasta = hastaBilgisiGetir(kayit);
    return hasta && hasta.telefon ? hasta.telefon : "Telefon yok";
  }

  function hastaAdresGetir(kayit: HastaKaydi) {
    const hasta = hastaBilgisiGetir(kayit);
    return hasta && hasta.adres ? hasta.adres : "Adres yok";
  }

  function toplamHesapla(kayit: HastaKaydi) {
    let toplam = 0;

    for (let i = 0; i < kayit.hasta_hizmetleri.length; i++) {
      const hizmet = kayit.hasta_hizmetleri[i];
      toplam += Number(hizmet.adet) * Number(hizmet.birim_fiyat);
    }

    return toplam;
  }

  function planBilgisi(kayit: HastaKaydi) {
    const tarih = kayit.plan_tarihi || "-";
    const saat = kayit.plan_saati ? String(kayit.plan_saati).slice(0, 5) : "-";
    return tarih + " / " + saat;
  }

  function kayitAc(kayit: HastaKaydi) {
    setSeciliKayit(kayit);
    setHemsireNotu(kayit.hemsire_notu || "");
    setOdemeDurumu(kayit.odeme_durumu || "Tamamı Alınmadı");
    setOdemeAciklama("");
    setSeciliHizmetId("");
    setHizmetFiyat("");
    setHizmetAciklama("");
  }

  function hizmetSec(hizmetId: string) {
    setSeciliHizmetId(hizmetId);

    const hizmet = hizmetler.find(function (item) {
      return item.id === hizmetId;
    });

    if (hizmet) {
      setHizmetFiyat(String(hizmet.fiyat));
      setHizmetAciklama(hizmet.aciklama || "");
    }
  }

  async function ekHizmetEkle() {
    if (!kullanici || !seciliKayit) return;

    const hizmet = hizmetler.find(function (item) {
      return item.id === seciliHizmetId;
    });

    if (!hizmet) {
      alert("Hizmet seçiniz.");
      return;
    }

    const { error: hizmetHata } = await supabase.from("hasta_hizmetleri").insert({
      hasta_kaydi_id: seciliKayit.id,
      hizmet_adi: hizmet.hizmet_adi,
      hizmet_tipi: "Hemşire Ek Hizmeti",
      adet: 1,
      birim_fiyat: Number(hizmetFiyat || 0),
      ekleyen_kullanici_id: kullanici.id,
      aciklama: hizmetAciklama,
    });

    if (hizmetHata) {
      alert("Ek hizmet eklenemedi.");
      console.log(hizmetHata);
      return;
    }

    await supabase
      .from("hasta_kayitlari")
      .update({
        durum: "Merkez Onayı Bekliyor",
      })
      .eq("id", seciliKayit.id);

    await supabase.from("bildirimler").insert({
      tip: "ek_hizmet",
      hasta_kaydi_id: seciliKayit.id,
      baslik: "Hemşire ek hizmet bildirdi",
      mesaj:
        kullanici.ad_soyad +
        ", " +
        hastaAdiGetir(seciliKayit) +
        " kaydına " +
        hizmet.hizmet_adi +
        " hizmetini ekledi.",
      okundu: false,
    });

    await verileriGetir(kullanici.id);
    alert("Ek hizmet merkeze bildirildi.");
  }

  async function odemeBildir() {
    if (!kullanici || !seciliKayit) return;

    await supabase.from("odemeler").insert({
      hasta_kaydi_id: seciliKayit.id,
      odeme_durumu: odemeDurumu,
      aciklama: odemeAciklama,
      ekleyen_kullanici_id: kullanici.id,
    });

    await supabase
      .from("hasta_kayitlari")
      .update({
        odeme_durumu: odemeDurumu,
        hemsire_notu: hemsireNotu,
        durum: "Merkez Onayı Bekliyor",
      })
      .eq("id", seciliKayit.id);

    await supabase.from("bildirimler").insert({
      tip: "odeme",
      hasta_kaydi_id: seciliKayit.id,
      baslik: "Hemşire ödeme bildirdi",
      mesaj:
        kullanici.ad_soyad +
        ", " +
        hastaAdiGetir(seciliKayit) +
        " kaydı için ödeme durumunu bildirdi: " +
        odemeDurumu,
      okundu: false,
    });

    await verileriGetir(kullanici.id);
    alert("Ödeme durumu merkeze bildirildi.");
  }

  async function notKaydet() {
    if (!kullanici || !seciliKayit) return;

    await supabase
      .from("hasta_kayitlari")
      .update({
        hemsire_notu: hemsireNotu,
      })
      .eq("id", seciliKayit.id);

    await verileriGetir(kullanici.id);
    alert("Not kaydedildi.");
  }

  async function onayaGonder() {
    if (!kullanici || !seciliKayit) return;

    await supabase
      .from("hasta_kayitlari")
      .update({
        durum: "Merkez Onayı Bekliyor",
        hemsire_notu: hemsireNotu,
      })
      .eq("id", seciliKayit.id);

    await supabase.from("bildirimler").insert({
      tip: "onay",
      hasta_kaydi_id: seciliKayit.id,
      baslik: "Hemşire merkez onayı istedi",
      mesaj:
        kullanici.ad_soyad +
        ", " +
        hastaAdiGetir(seciliKayit) +
        " kaydını merkez onayına gönderdi.",
      okundu: false,
    });

    await verileriGetir(kullanici.id);
    alert("Merkez onayına gönderildi.");
  }

  function cikisYap() {
    oturumTemizle();
    window.location.href = "/giris";
  }

  if (yukleniyor) {
    return (
      <main style={{ padding: 30, fontFamily: "Arial" }}>
        <h2>Geropital yükleniyor...</h2>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f7fb",
        fontFamily: "Arial, sans-serif",
        paddingBottom: 30,
      }}
    >
      <header
        style={{
          background: "white",
          padding: 16,
          borderBottom: "1px solid #d7e4f2",
        }}
      >
        <img
          src="/logo-geropital.png"
          alt="Geropital"
          style={{ height: 48, display: "block", marginBottom: 10 }}
        />

        <h1 style={{ color: "#144a7b", fontSize: 22, margin: 0 }}>
          Hemşire Paneli
        </h1>

        <p style={{ color: "#475569", marginTop: 6 }}>
          iPhone uyumlu hafif saha ekranı
        </p>

        <button
          onClick={cikisYap}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 14,
            borderRadius: 12,
            border: 0,
            background: "#111827",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          Çıkış
        </button>
      </header>

      <section style={{ padding: 14 }}>
        <h2 style={{ fontSize: 20, color: "#0f172a" }}>
          Bana Atanan Kayıtlar
        </h2>

        {kayitlar.length === 0 && (
          <div
            style={{
              background: "white",
              padding: 18,
              borderRadius: 16,
              color: "#64748b",
            }}
          >
            Size atanmış aktif kayıt bulunmuyor.
          </div>
        )}

        {kayitlar.map(function (kayit) {
          return (
            <div
              key={kayit.id}
              style={{
                background: "white",
                borderRadius: 18,
                padding: 16,
                marginBottom: 12,
                border: "1px solid #dbe7f3",
              }}
            >
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
                {hastaAdiGetir(kayit)}
              </h3>

              <p style={{ margin: "6px 0", color: "#475569" }}>
                {hastaTelefonGetir(kayit)}
              </p>

              <p style={{ margin: "6px 0", color: "#475569" }}>
                {hastaAdresGetir(kayit)}
              </p>

              <p style={{ margin: "8px 0", color: "#144a7b", fontWeight: "bold" }}>
                Plan: {planBilgisi(kayit)}
              </p>

              <p style={{ margin: "8px 0", color: "#0f172a", fontWeight: "bold" }}>
                Toplam: {toplamHesapla(kayit).toLocaleString("tr-TR")} TL
              </p>

              <p style={{ margin: "8px 0", color: "#475569" }}>
                Durum: {kayit.durum}
              </p>

              <button
                onClick={function () {
                  kayitAc(kayit);
                }}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: 0,
                  background: "#144a7b",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 16,
                  marginTop: 10,
                }}
              >
                Kaydı Aç
              </button>
            </div>
          );
        })}
      </section>

      {seciliKayit && (
        <section
          style={{
            margin: 14,
            background: "white",
            borderRadius: 18,
            padding: 16,
            border: "2px solid #144a7b",
          }}
        >
          <h2 style={{ color: "#144a7b", marginTop: 0 }}>
            {hastaAdiGetir(seciliKayit)}
          </h2>

          <p>{hastaTelefonGetir(seciliKayit)}</p>
          <p>{hastaAdresGetir(seciliKayit)}</p>

          <button
            onClick={function () {
              setSeciliKayit(null);
            }}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            Kaydı Kapat
          </button>

          <h3>Hizmetler</h3>

          {seciliKayit.hasta_hizmetleri.map(function (hizmet) {
            return (
              <div
                key={hizmet.id}
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <b>{hizmet.hizmet_adi}</b>
                <p style={{ margin: "4px 0" }}>
                  {Number(hizmet.adet) * Number(hizmet.birim_fiyat)} TL
                </p>
              </div>
            );
          })}

          <h3>Ek Hizmet Ekle</h3>

          <select
            value={seciliHizmetId}
            onChange={function (e) {
              hizmetSec(e.target.value);
            }}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <option value="">Hizmet seçiniz</option>
            {hizmetler.map(function (hizmet) {
              return (
                <option key={hizmet.id} value={hizmet.id}>
                  {hizmet.hizmet_adi} - {hizmet.fiyat} TL
                </option>
              );
            })}
          </select>

          <input
            value={hizmetFiyat}
            onChange={function (e) {
              setHizmetFiyat(e.target.value);
            }}
            placeholder="Fiyat"
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
              border: "1px solid #cbd5e1",
            }}
          />

          <textarea
            value={hizmetAciklama}
            onChange={function (e) {
              setHizmetAciklama(e.target.value);
            }}
            placeholder="Hizmet açıklaması"
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
              border: "1px solid #cbd5e1",
            }}
          />

          <button
            onClick={ekHizmetEkle}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: 0,
              background: "#144a7b",
              color: "white",
              fontWeight: "bold",
              marginBottom: 18,
            }}
          >
            Ek Hizmeti Bildir
          </button>

          <h3>Ödeme Durumu</h3>

          <select
            value={odemeDurumu}
            onChange={function (e) {
              setOdemeDurumu(e.target.value);
            }}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            {odemeSecenekleri.map(function (secenek) {
              return <option key={secenek}>{secenek}</option>;
            })}
          </select>

          <textarea
            value={odemeAciklama}
            onChange={function (e) {
              setOdemeAciklama(e.target.value);
            }}
            placeholder="Ödeme açıklaması"
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
              border: "1px solid #cbd5e1",
            }}
          />

          <button
            onClick={odemeBildir}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: 0,
              background: "#059669",
              color: "white",
              fontWeight: "bold",
              marginBottom: 18,
            }}
          >
            Ödemeyi Bildir
          </button>

          <h3>Hemşire Notu</h3>

          <textarea
            value={hemsireNotu}
            onChange={function (e) {
              setHemsireNotu(e.target.value);
            }}
            placeholder="Hasta işlem notu"
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
              border: "1px solid #cbd5e1",
            }}
          />

          <button
            onClick={notKaydet}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: 0,
              background: "#2563eb",
              color: "white",
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            Notu Kaydet
          </button>

          <button
            onClick={onayaGonder}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: 0,
              background: "#d97706",
              color: "white",
              fontWeight: "bold",
            }}
          >
            Merkez Onayına Gönder
          </button>
        </section>
      )}
    </main>
  );
}