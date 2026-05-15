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
  const [modalAcik, setModalAcik] = useState(false);

  const [seciliHizmetId, setSeciliHizmetId] = useState("");
  const [hizmetFiyat, setHizmetFiyat] = useState("");
  const [hizmetAciklama, setHizmetAciklama] = useState("");
  const [odemeDurumu, setOdemeDurumu] = useState("Tamamı Alınmadı");
  const [odemeAciklama, setOdemeAciklama] = useState("");
  const [hemsireNotu, setHemsireNotu] = useState("");

  const [odemeTasdiriYapiliyor, setOdemeTasdiriYapiliyor] = useState(false);
  const [onayTasdiriYapiliyor, setOnayTasdiriYapiliyor] = useState(false);

  useEffect(() => {
    async function baslat() {
      async function kullaniciBilgisiniAl() {
        const url = window.location.search || "";
        const eslesen = url.match(/kullaniciId=([^&]+)/);
        const urlKullaniciId = eslesen ? decodeURIComponent(eslesen[1]) : "";

        if (urlKullaniciId) {
          console.log("🔗 URL'den Kullanıcı ID Bulundu:", urlKullaniciId);
          
          const { data, error } = await supabase
            .from("kullanicilar")
            .select("id, ad_soyad, rol")
            .eq("id", urlKullaniciId)
            .eq("aktif", true)
            .single();

          if (error || !data || data.rol !== "hemsire") {
            console.log("❌ URL Kullanıcı Doğrulaması Başarısız");
            window.location.href = "/iphone-giris";
            return;
          }

          console.log("✅ URL Kullanıcısı Doğrulandı:", data.ad_soyad);
          setKullanici(data);
          verileriGetir(data.id);
          return;
        }

        console.log("💾 localStorage'dan Kullanıcı Aranıyor...");
        const aktifKullanici = kullaniciOku();

        if (!aktifKullanici) {
          console.log("❌ localStorage'da Kullanıcı Yok");
          window.location.href = "/iphone-giris";
          return;
        }

        if (aktifKullanici.rol !== "hemsire") {
          console.log("❌ Rol Hemşire Değil:", aktifKullanici.rol);
          window.location.href = "/iphone-giris";
          return;
        }

        console.log("✅ localStorage Kullanıcısı Doğrulandı:", aktifKullanici.ad_soyad);
        setKullanici(aktifKullanici);
        verileriGetir(aktifKullanici.id);
      }

      await kullaniciBilgisiniAl();

      // ESC tuşu ile modal'ı kapatma
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setModalAcik(false);
        }
      };

      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
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

  function durumuRenklendirme(durum: string) {
    const renkler: { [key: string]: { bg: string; text: string } } = {
      "Merkez Onayı Bekliyor": { bg: "#fef08a", text: "#854d0e" },
      "Onaylı": { bg: "#dcfce7", text: "#166534" },
      "Hazır": { bg: "#cffafe", text: "#164e63" },
      "Tamamlandı": { bg: "#f3f4f6", text: "#374151" },
      "Red Verdi": { bg: "#fee2e2", text: "#991b1b" },
    };

    const renk = renkler[durum] || { bg: "#f3f4f6", text: "#374151" };
    return renk;
  }

  function odemeRenklendirme(odemeDurumu: string) {
    const renkler: { [key: string]: { bg: string; text: string } } = {
      "Kredi Kartı ile Tamamı Alındı": { bg: "#dcfce7", text: "#166534" },
      "Nakit Tamamı Alındı": { bg: "#dcfce7", text: "#166534" },
      "EFT / Havale Yapılacak": { bg: "#fed7aa", text: "#92400e" },
      "Tamamı Alınmadı": { bg: "#fee2e2", text: "#991b1b" },
    };

    const renk = renkler[odemeDurumu] || { bg: "#f3f4f6", text: "#374151" };
    return renk;
  }

  function kayitAc(kayit: HastaKaydi) {
    setSeciliKayit(kayit);
    setHemsireNotu(kayit.hemsire_notu || "");
    setOdemeDurumu(kayit.odeme_durumu || "Tamamı Alınmadı");
    setOdemeAciklama("");
    setSeciliHizmetId("");
    setHizmetFiyat("");
    setHizmetAciklama("");
    setModalAcik(true);
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

    if (!window.confirm("Ödeme durumunu merkeze bildir?")) {
      return;
    }

    setOdemeTasdiriYapiliyor(true);

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

    setOdemeTasdiriYapiliyor(false);
    await verileriGetir(kullanici.id);
    alert("Ödeme durumu merkeze bildirildi.");
    setModalAcik(false);
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

    if (!window.confirm("Kaydı merkez onayına gönder?")) {
      return;
    }

    setOnayTasdiriYapiliyor(true);

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

    setOnayTasdiriYapiliyor(false);
    await verileriGetir(kullanici.id);
    alert("Merkez onayına gönderildi.");
    setModalAcik(false);
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
          background: "linear-gradient(135deg, #144a7b 0%, #0f3a5f 100%)",
          padding: 16,
          borderBottom: "1px solid #d7e4f2",
        }}
      >
        <img
          src="/logo-geropital.png"
          alt="Geropital"
          style={{ height: 48, display: "block", marginBottom: 10 }}
        />

        <h1 style={{ color: "white", fontSize: 22, margin: 0 }}>
          Hemşire Paneli
        </h1>

        <p style={{ color: "rgba(255,255,255,0.85)", marginTop: 6 }}>
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
            background: "rgba(0,0,0,0.2)",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.2)")}
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
          const durumuRenk = durumuRenklendirme(kayit.durum);
          const odemeRenk = odemeRenklendirme(kayit.odeme_durumu);

          return (
            <div
              key={kayit.id}
              style={{
                background: "white",
                borderRadius: 18,
                padding: 16,
                marginBottom: 12,
                border: "1px solid #dbe7f3",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(20, 74, 123, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
                {hastaAdiGetir(kayit)}
              </h3>

              <p style={{ margin: "6px 0", color: "#475569", fontSize: 14 }}>
                {hastaTelefonGetir(kayit)}
              </p>

              <p style={{ margin: "6px 0", color: "#475569", fontSize: 14 }}>
                {hastaAdresGetir(kayit)}
              </p>

              <p style={{ margin: "8px 0", color: "#144a7b", fontWeight: "bold" }}>
                Plan: {planBilgisi(kayit)}
              </p>

              <p style={{ margin: "8px 0", color: "#0f172a", fontWeight: "bold", fontSize: 18 }}>
                Toplam: {toplamHesapla(kayit).toLocaleString("tr-TR")} TL
              </p>

              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <div
                  style={{
                    background: durumuRenk.bg,
                    color: durumuRenk.text,
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: "bold",
                  }}
                >
                  {kayit.durum}
                </div>
                <div
                  style={{
                    background: odemeRenk.bg,
                    color: odemeRenk.text,
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: "bold",
                  }}
                >
                  {kayit.odeme_durumu}
                </div>
              </div>

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
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0f3a5f";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#144a7b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Kaydı Aç
              </button>
            </div>
          );
        })}
      </section>

      {modalAcik && seciliKayit && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 1000,
            animation: "slideUp 0.3s ease-out",
          }}
          onClick={() => setModalAcik(false)}
        >
          <div
            style={{
              width: "100%",
              background: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ color: "#144a7b", margin: 0, fontSize: 24 }}>
                {hastaAdiGetir(seciliKayit)}
              </h2>
              <button
                onClick={() => setModalAcik(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 28,
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "4px 0", color: "#475569", fontSize: 14 }}>
              {hastaTelefonGetir(seciliKayit)}
            </p>
            <p style={{ margin: "4px 0 16px 0", color: "#475569", fontSize: 14 }}>
              {hastaAdresGetir(seciliKayit)}
            </p>

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />

            <h3 style={{ fontSize: 16, color: "#0f172a", marginTop: 20, marginBottom: 12 }}>
              📋 Hizmetler
            </h3>

            {seciliKayit.hasta_hizmetleri.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Hizmet bulunmuyor</p>
            ) : (
              seciliKayit.hasta_hizmetleri.map(function (hizmet) {
                return (
                  <div
                    key={hizmet.id}
                    style={{
                      background: "#f8fafc",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderLeft: "4px solid #144a7b",
                    }}
                  >
                    <b style={{ color: "#0f172a" }}>{hizmet.hizmet_adi}</b>
                    <p style={{ margin: "4px 0 0 0", color: "#475569", fontSize: 13 }}>
                      {Number(hizmet.adet)} × {Number(hizmet.birim_fiyat).toLocaleString("tr-TR")} = {Number(hizmet.adet) * Number(hizmet.birim_fiyat)} TL
                    </p>
                  </div>
                );
              })
            )}

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />

            <h3 style={{ fontSize: 16, color: "#0f172a", marginTop: 20, marginBottom: 12 }}>
              ➕ Ek Hizmet Ekle
            </h3>

            <select
              value={seciliHizmetId}
              onChange={function (e) {
                hizmetSec(e.target.value);
              }}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                marginBottom: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                fontFamily: "inherit",
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
              type="number"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                marginBottom: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            />

            <textarea
              value={hizmetAciklama}
              onChange={function (e) {
                setHizmetAciklama(e.target.value);
              }}
              placeholder="Hizmet açıklaması (opsiyonel)"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                marginBottom: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                fontFamily: "inherit",
                minHeight: 60,
              }}
            />

            <button
              onClick={ekHizmetEkle}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: 0,
                background: "#144a7b",
                color: "white",
                fontWeight: "bold",
                fontSize: 14,
                marginBottom: 16,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0f3a5f")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#144a7b")}
            >
              Ek Hizmeti Bildir
            </button>

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />

            <h3 style={{ fontSize: 16, color: "#0f172a", marginTop: 20, marginBottom: 12 }}>
              💳 Ödeme Durumu
            </h3>

            <select
              value={odemeDurumu}
              onChange={function (e) {
                setOdemeDurumu(e.target.value);
              }}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                marginBottom: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                fontFamily: "inherit",
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
              placeholder="Ödeme açıklaması (opsiyonel)"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                marginBottom: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                fontFamily: "inherit",
                minHeight: 60,
              }}
            />

            <button
              onClick={odemeBildir}
              disabled={odemeTasdiriYapiliyor}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: 0,
                background: odemeTasdiriYapiliyor ? "#cbd5e1" : "#059669",
                color: "white",
                fontWeight: "bold",
                fontSize: 14,
                marginBottom: 16,
                cursor: odemeTasdiriYapiliyor ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => !odemeTasdiriYapiliyor && (e.currentTarget.style.background = "#047857")}
              onMouseLeave={(e) => !odemeTasdiriYapiliyor && (e.currentTarget.style.background = "#059669")}
            >
              {odemeTasdiriYapiliyor ? "Gönderiliyor..." : "Ödemeyi Bildir"}
            </button>

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />

            <h3 style={{ fontSize: 16, color: "#0f172a", marginTop: 20, marginBottom: 12 }}>
              📝 Hemşire Notu
            </h3>

            <textarea
              value={hemsireNotu}
              onChange={function (e) {
                setHemsireNotu(e.target.value);
              }}
              placeholder="Hasta işlem notu"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                marginBottom: 10,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                fontFamily: "inherit",
                minHeight: 80,
              }}
            />

            <button
              onClick={notKaydet}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: 0,
                background: "#2563eb",
                color: "white",
                fontWeight: "bold",
                fontSize: 14,
                marginBottom: 10,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
            >
              Notu Kaydet
            </button>

            <button
              onClick={onayaGonder}
              disabled={onayTasdiriYapiliyor}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: 0,
                background: onayTasdiriYapiliyor ? "#cbd5e1" : "#d97706",
                color: "white",
                fontWeight: "bold",
                fontSize: 14,
                marginBottom: 10,
                cursor: onayTasdiriYapiliyor ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => !onayTasdiriYapiliyor && (e.currentTarget.style.background = "#b45309")}
              onMouseLeave={(e) => !onayTasdiriYapiliyor && (e.currentTarget.style.background = "#d97706")}
            >
              {onayTasdiriYapiliyor ? "Gönderiliyor..." : "Merkez Onayına Gönder"}
            </button>

            <div style={{ height: 20 }} />
          </div>

          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </main>
  );
}