"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/kutuphane/supabase";
import KurumsalLogo from "@/bilesenler/KurumsalLogo";
import KurumsalNavbar from "@/bilesenler/KurumsalNavbar";
import KurumsalHeader from "@/bilesenler/KurumsalHeader";

type Kullanici = {
  id: string;
  kullanici_adi: string;
  sifre: string;
  ad_soyad: string;
  rol: "merkez" | "hemsire";
  aktif: boolean;
};

type Hizmet = {
  id: string;
  hizmet_adi: string;
  fiyat: number;
  kategori: string | null;
  aciklama: string | null;
  aktif: boolean;
};

type HastaKaydi = {
  id: string;
  durum: string;
  odeme_durumu: string;
  merkez_notu: string | null;
  hemsire_notu: string | null;
  kapanis_notu: string | null;
  olusturma_tarihi: string;
  kapanis_tarihi: string | null;
  hastalar: {
    id: string;
    hasta_adi: string;
    telefon: string | null;
    adres: string | null;
    notlar: string | null;
  }[];
  hasta_hizmetleri: {
    id: string;
    hizmet_adi: string;
    hizmet_tipi: string;
    adet: number;
    birim_fiyat: number;
    aciklama: string | null;
  }[];
  odemeler: {
    id: string;
    odeme_durumu: string;
    aciklama: string | null;
    olusturma_tarihi: string;
  }[];
};

const odemeSecenekleri = [
  "Kredi Kartı ile Tamamı Alındı",
  "Nakit Tamamı Alındı",
  "EFT / Havale Yapılacak",
  "Tamamı Alınmadı",
];

export default function HemsirePaneli() {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [hastaKayitlari, setHastaKayitlari] = useState<HastaKaydi[]>([]);
  const [gecmisKayitlar, setGecmisKayitlar] = useState<HastaKaydi[]>([]);
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [seciliKayit, setSeciliKayit] = useState<HastaKaydi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [hastaAdi, setHastaAdi] = useState("");
  const [hastaTelefon, setHastaTelefon] = useState("");
  const [hastaAdresi, setHastaAdresi] = useState("");
  const [hemsireNotuYeniKayit, setHemsireNotuYeniKayit] = useState("");

  const [seciliHizmetId, setSeciliHizmetId] = useState("");
  const [hizmetAdet, setHizmetAdet] = useState("1");
  const [hizmetFiyat, setHizmetFiyat] = useState("");
  const [hizmetAciklama, setHizmetAciklama] = useState("");

  const [odemeDurumu, setOdemeDurumu] = useState("Tamamı Alınmadı");
  const [odemeAciklama, setOdemeAciklama] = useState("");
  const [hemsireNotu, setHemsireNotu] = useState("");

  useEffect(() => {
    const kayitliKullanici = localStorage.getItem("kullanici");

    if (!kayitliKullanici) {
      window.location.href = "/giris";
      return;
    }

    const aktifKullanici = JSON.parse(kayitliKullanici);

    if (aktifKullanici.rol !== "hemsire") {
      window.location.href = "/merkez-paneli";
      return;
    }

    setKullanici(aktifKullanici);
    verileriGetir(aktifKullanici.id);
  }, []);

  function hastaAdiGetir(kayit: HastaKaydi) {
    const hasta = Array.isArray(kayit.hastalar)
      ? kayit.hastalar[0]
      : kayit.hastalar;

    return hasta?.hasta_adi || "hasta";
  }

  function hastaTelefonGetir(kayit: HastaKaydi) {
    const hasta = Array.isArray(kayit.hastalar)
      ? kayit.hastalar[0]
      : kayit.hastalar;

    return hasta?.telefon || "Telefon yok";
  }

  function hastaAdresGetir(kayit: HastaKaydi) {
    const hasta = Array.isArray(kayit.hastalar)
      ? kayit.hastalar[0]
      : kayit.hastalar;

    return hasta?.adres || "Adres yok";
  }

  function tarihSaatFormatla(tarih: string | null) {
    if (!tarih) return "-";

    return new Date(tarih).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function verileriGetir(hemsireId?: string) {
    const aktifHemsireId = hemsireId || kullanici?.id;

    if (!aktifHemsireId) return;

    setYukleniyor(true);

    const { data: aktifData, error: aktifHata } = await supabase
      .from("hasta_kayitlari")
      .select(`
        id,
        durum,
        odeme_durumu,
        merkez_notu,
        hemsire_notu,
        kapanis_notu,
        olusturma_tarihi,
        kapanis_tarihi,
        hastalar (
          id,
          hasta_adi,
          telefon,
          adres,
          notlar
        ),
        hasta_hizmetleri (
          id,
          hizmet_adi,
          hizmet_tipi,
          adet,
          birim_fiyat,
          aciklama
        ),
        odemeler (
          id,
          odeme_durumu,
          aciklama,
          olusturma_tarihi
        )
      `)
      .eq("hemsire_id", aktifHemsireId)
      .neq("durum", "Kapalı")
      .order("olusturma_tarihi", { ascending: false });

    const { data: gecmisData, error: gecmisHata } = await supabase
      .from("hasta_kayitlari")
      .select(`
        id,
        durum,
        odeme_durumu,
        merkez_notu,
        hemsire_notu,
        kapanis_notu,
        olusturma_tarihi,
        kapanis_tarihi,
        hastalar (
          id,
          hasta_adi,
          telefon,
          adres,
          notlar
        ),
        hasta_hizmetleri (
          id,
          hizmet_adi,
          hizmet_tipi,
          adet,
          birim_fiyat,
          aciklama
        ),
        odemeler (
          id,
          odeme_durumu,
          aciklama,
          olusturma_tarihi
        )
      `)
      .eq("hemsire_id", aktifHemsireId)
      .eq("durum", "Kapalı")
      .order("kapanis_tarihi", { ascending: false });

    const { data: hizmetData, error: hizmetHata } = await supabase
      .from("hizmet_katalogu")
      .select("*")
      .eq("aktif", true)
      .order("hizmet_adi", { ascending: true });

    if (aktifHata) console.log("Aktif kayıtlar çekilemedi:", aktifHata);
    if (gecmisHata) console.log("Geçmiş kayıtlar çekilemedi:", gecmisHata);
    if (hizmetHata) console.log("Hizmetler çekilemedi:", hizmetHata);

    setHastaKayitlari((aktifData as HastaKaydi[]) || []);
    setGecmisKayitlar((gecmisData as HastaKaydi[]) || []);
    setHizmetler((hizmetData as Hizmet[]) || []);
    setYukleniyor(false);
  }

  function toplamTutarHesapla(kayit: HastaKaydi) {
    return (kayit.hasta_hizmetleri || []).reduce((toplam, hizmet) => {
      return toplam + Number(hizmet.adet) * Number(hizmet.birim_fiyat);
    }, 0);
  }

  async function hemsireHastaKaydiAc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!kullanici) {
      alert("Kullanıcı bulunamadı. Tekrar giriş yapın.");
      return;
    }

    if (!hastaAdi.trim()) {
      alert("Hasta adı zorunludur.");
      return;
    }

    const { data: hasta, error: hastaHata } = await supabase
      .from("hastalar")
      .insert({
        hasta_adi: hastaAdi,
        telefon: hastaTelefon,
        adres: hastaAdresi,
        notlar: "",
      })
      .select()
      .single();

    if (hastaHata || !hasta) {
      console.log("Hasta oluşturma hatası:", hastaHata);
      alert("Hasta oluşturulamadı.");
      return;
    }

    const { data: kayit, error: kayitHata } = await supabase
      .from("hasta_kayitlari")
      .insert({
        hasta_id: hasta.id,
        hemsire_id: kullanici.id,
        acan_kullanici_id: kullanici.id,
        durum: "Aktif",
        odeme_durumu: "Tamamı Alınmadı",
        merkez_notu: "",
        hemsire_notu: hemsireNotuYeniKayit,
        kapanis_notu: "",
      })
      .select()
      .single();

    if (kayitHata || !kayit) {
      console.log("Hasta kaydı oluşturma hatası:", kayitHata);
      alert("Hasta kaydı oluşturulamadı.");
      return;
    }

    await supabase.from("bildirimler").insert({
      hasta_kaydi_id: kayit.id,
      baslik: "Hemşire yeni hasta kaydı açtı",
      mesaj: `${kullanici.ad_soyad} tarafından ${hasta.hasta_adi} adına yeni kayıt açıldı.`,
      okundu: false,
    });

    setHastaAdi("");
    setHastaTelefon("");
    setHastaAdresi("");
    setHemsireNotuYeniKayit("");

    await verileriGetir(kullanici.id);
    alert("Hasta kaydı oluşturuldu.");
  }

  function hizmetSec(hizmetId: string) {
    setSeciliHizmetId(hizmetId);

    const hizmet = hizmetler.find((h) => h.id === hizmetId);

    if (hizmet) {
      setHizmetFiyat(String(hizmet.fiyat));
      setHizmetAciklama(hizmet.aciklama || "");
    }
  }

  async function ekHizmetEkle() {
    if (!kullanici || !seciliKayit) return;

    const hizmet = hizmetler.find((h) => h.id === seciliHizmetId);

    if (!hizmet) {
      alert("Hizmet seçiniz.");
      return;
    }

    if (!hizmetFiyat || Number(hizmetFiyat) < 0) {
      alert("Geçerli fiyat giriniz.");
      return;
    }

    const { error } = await supabase.from("hasta_hizmetleri").insert({
      hasta_kaydi_id: seciliKayit.id,
      hizmet_adi: hizmet.hizmet_adi,
      hizmet_tipi: "Hemşire Ek Hizmeti",
      adet: Number(hizmetAdet || 1),
      birim_fiyat: Number(hizmetFiyat),
      ekleyen_kullanici_id: kullanici.id,
      aciklama: hizmetAciklama,
    });

    if (error) {
      console.log("Ek hizmet ekleme hatası:", error);
      alert("Ek hizmet eklenemedi.");
      return;
    }

    await supabase
      .from("hasta_kayitlari")
      .update({
        durum: "Merkez Onayı Bekliyor",
      })
      .eq("id", seciliKayit.id);

    await supabase.from("bildirimler").insert({
      hasta_kaydi_id: seciliKayit.id,
      baslik: "Hemşire ek hizmet bildirdi",
      mesaj: `${kullanici.ad_soyad}, ${hastaAdiGetir(seciliKayit)} kaydına ${hizmet.hizmet_adi} hizmetini ekledi.`,
      okundu: false,
    });

    setSeciliHizmetId("");
    setHizmetAdet("1");
    setHizmetFiyat("");
    setHizmetAciklama("");

    await verileriGetir(kullanici.id);
    alert("Ek hizmet merkeze bildirildi.");
  }

  async function odemeDurumuBildir() {
    if (!kullanici || !seciliKayit) return;

    const { error: odemeHata } = await supabase.from("odemeler").insert({
      hasta_kaydi_id: seciliKayit.id,
      odeme_durumu: odemeDurumu,
      aciklama: odemeAciklama,
      ekleyen_kullanici_id: kullanici.id,
    });

    if (odemeHata) {
      console.log("Ödeme bildirimi hatası:", odemeHata);
      alert("Ödeme durumu bildirilemedi.");
      return;
    }

    const { error: kayitHata } = await supabase
      .from("hasta_kayitlari")
      .update({
        odeme_durumu: odemeDurumu,
        hemsire_notu: hemsireNotu,
        durum: "Merkez Onayı Bekliyor",
      })
      .eq("id", seciliKayit.id);

    if (kayitHata) {
      console.log("Kayıt güncelleme hatası:", kayitHata);
      alert("Hasta kaydı güncellenemedi.");
      return;
    }

    await supabase.from("bildirimler").insert({
      hasta_kaydi_id: seciliKayit.id,
      baslik: "Hemşire ödeme durumu bildirdi",
      mesaj: `${kullanici.ad_soyad}, ${hastaAdiGetir(seciliKayit)} kaydı için ödeme durumunu "${odemeDurumu}" olarak bildirdi.`,
      okundu: false,
    });

    setOdemeDurumu("Tamamı Alınmadı");
    setOdemeAciklama("");

    await verileriGetir(kullanici.id);
    alert("Ödeme durumu merkeze bildirildi.");
  }

  async function hemsireNotuKaydet() {
    if (!kullanici || !seciliKayit) return;

    const { error } = await supabase
      .from("hasta_kayitlari")
      .update({
        hemsire_notu: hemsireNotu,
      })
      .eq("id", seciliKayit.id);

    if (error) {
      console.log("Hemşire notu hatası:", error);
      alert("Hemşire notu kaydedilemedi.");
      return;
    }

    await verileriGetir(kullanici.id);
    alert("Hemşire notu kaydedildi.");
  }

  async function merkezeOnayaGonder() {
    if (!kullanici || !seciliKayit) return;

    const { error } = await supabase
      .from("hasta_kayitlari")
      .update({
        durum: "Merkez Onayı Bekliyor",
        hemsire_notu: hemsireNotu,
      })
      .eq("id", seciliKayit.id);

    if (error) {
      console.log("Merkez onayı gönderme hatası:", error);
      alert("Merkez onayına gönderilemedi.");
      return;
    }

    await supabase.from("bildirimler").insert({
      hasta_kaydi_id: seciliKayit.id,
      baslik: "Hemşire merkez onayı istedi",
      mesaj: `${kullanici.ad_soyad}, ${hastaAdiGetir(seciliKayit)} kaydını merkez onayına gönderdi.`,
      okundu: false,
    });

    await verileriGetir(kullanici.id);
    alert("Kayıt merkez onayına gönderildi.");
  }

  function modalAc(kayit: HastaKaydi) {
    setSeciliKayit(kayit);
    setHemsireNotu(kayit.hemsire_notu || "");
    setOdemeDurumu(kayit.odeme_durumu || "Tamamı Alınmadı");
  }

  function cikisYap() {
    localStorage.removeItem("kullanici");
    window.location.href = "/giris";
  }

  return (
    <main className="min-h-screen kurumsal-arka-plan">
      <section className="border-b border-[#144a7b]/10 py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-5">
          <h1 className="text-3xl lg:text-4xl font-black text-[#144a7b] mb-2">Hemşire Paneli</h1>
          <p className="text-sm text-slate-600">Hemşire hasta kayıtları ve saha işlem ekranı</p>
        </div>
      </section>

      <KurumsalHeader
        linkler={[
          { href: "/merkez-paneli", label: "Merkez Paneli" },
          { href: "/gunluk-saha-plani", label: "G\u00fcnl\u00fck Saha Plan\u0131" },
          { href: "/hizmet-yonetimi", label: "Hizmet Y\u00f6netimi" },
          { href: "/bildirimler", label: "Bildirimler" },
          { href: "/kapatilan-hasta-kayitlari", label: "Kaapat\u0131lan Kay\u0131tlar" },
          { href: "/hemsire-paneli", label: "Hem\u015fire Paneli" },
        ]}
        sagAlan={
          <button
            onClick={cikisYap}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold transition hover:bg-slate-800"
          >
            Çıkış
          </button>
        }
      />

      <div className="max-w-7xl mx-auto p-5 grid lg:grid-cols-3 gap-6">
        <section className="kurumsal-kart rounded-3xl p-6 h-fit">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Yeni Hasta Kaydı Aç
          </h2>

          <form onSubmit={hemsireHastaKaydiAc} className="space-y-3">
            <input
              value={hastaAdi}
              onChange={(e) => setHastaAdi(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              placeholder="Hasta adı soyadı"
            />

            <input
              value={hastaTelefon}
              onChange={(e) => setHastaTelefon(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              placeholder="Telefon"
            />

            <textarea
              value={hastaAdresi}
              onChange={(e) => setHastaAdresi(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 min-h-24"
              placeholder="Adres"
            />

            <textarea
              value={hemsireNotuYeniKayit}
              onChange={(e) => setHemsireNotuYeniKayit(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 min-h-24"
              placeholder="Hemşire notu"
            />

            <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-black">
              Hasta Kaydı Aç
            </button>
          </form>
        </section>

        <section className="lg:col-span-2 kurumsal-kart rounded-3xl p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Bana Atanan Hasta Kayıtları
          </h2>

          <div className="space-y-4">
            {hastaKayitlari.length === 0 && (
              <p className="text-slate-500">Size atanmış aktif hasta kaydı bulunmuyor.</p>
            )}

            {hastaKayitlari.map((kayit) => {
              const toplam = toplamTutarHesapla(kayit);

              return (
                <div key={kayit.id} className="border border-slate-200 rounded-2xl p-5">
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        {hastaAdiGetir(kayit) || "Hasta adı yok"}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {hastaTelefonGetir(kayit)}
                      </p>
                      <p className="text-sm text-slate-600">
                        {hastaAdresGetir(kayit)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Kayıt Açılış: {tarihSaatFormatla(kayit.olusturma_tarihi)}
                      </p>
                      {kayit.kapanis_tarihi && (
                        <p className="text-xs text-slate-500">
                          Kapanış: {tarihSaatFormatla(kayit.kapanis_tarihi)}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-black text-slate-900">{kayit.durum}</p>
                      <p className="text-sm text-slate-600">{kayit.odeme_durumu}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 mt-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Toplam Tutar</p>
                      <p className="font-black text-slate-900">
                        {toplam.toLocaleString("tr-TR")} TL
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Ödeme Durumu</p>
                      <p className="font-black text-slate-900">
                        {kayit.odeme_durumu}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Durum</p>
                      <p className="font-black text-slate-900">{kayit.durum}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => modalAc(kayit)}
                    className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-black"
                  >
                    Kaydı Aç
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-3 kurumsal-kart rounded-3xl p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Kapatılan Bana Ait Kayıtlar
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gecmisKayitlar.length === 0 && (
              <p className="text-slate-500">Kapatılmış kayıt bulunmuyor.</p>
            )}

            {gecmisKayitlar.map((kayit) => (
              <div key={kayit.id} className="border border-slate-200 rounded-2xl p-4">
                <h3 className="font-black text-slate-900">
                  {hastaAdiGetir(kayit)}
                </h3>
                <p className="text-sm text-slate-600">{hastaTelefonGetir(kayit)}</p>
                <p className="text-sm text-slate-600">{kayit.odeme_durumu}</p>
                <button
                  onClick={() => modalAc(kayit)}
                  className="w-full mt-3 bg-slate-900 text-white rounded-xl py-2 font-bold"
                >
                  Geçmiş Kaydı Aç
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {seciliKayit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="kurumsal-kart rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6">
            <div className="flex justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {hastaAdiGetir(seciliKayit)}
                </h2>
                <p className="text-sm text-slate-600">
                  {hastaTelefonGetir(seciliKayit)}
                </p>
                <p className="text-sm text-slate-600">
                  {hastaAdresGetir(seciliKayit)}
                </p>
              </div>

              <button
                onClick={() => setSeciliKayit(null)}
                className="bg-slate-100 px-4 py-2 rounded-xl font-black"
              >
                Kapat
              </button>
            </div>

            <section className="grid md:grid-cols-2 gap-4 mb-5">
              <div className="bg-blue-50 rounded-2xl p-4">
                <p className="font-black text-blue-900">Merkez Notu</p>
                <p className="text-blue-900 mt-1">
                  {seciliKayit.merkez_notu || "Merkez notu yok."}
                </p>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4">
                <p className="font-black text-amber-900">Hemşire Notu</p>
                <p className="text-amber-900 mt-1">
                  {seciliKayit.hemsire_notu || "Hemşire notu yok."}
                </p>
              </div>
            </section>

            <section className="space-y-3 mb-5">
              <h3 className="font-black text-slate-900">Hizmetler</h3>

              {(seciliKayit.hasta_hizmetleri || []).length === 0 && (
                <p className="text-slate-500">Henüz hizmet eklenmedi.</p>
              )}

              {(seciliKayit.hasta_hizmetleri || []).map((hizmet) => (
                <div key={hizmet.id} className="border border-slate-200 rounded-xl p-3 flex justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{hizmet.hizmet_adi}</p>
                    <p className="text-sm text-slate-500">
                      {hizmet.hizmet_tipi} • {hizmet.aciklama}
                    </p>
                  </div>

                  <p className="font-black text-slate-900">
                    {(Number(hizmet.adet) * Number(hizmet.birim_fiyat)).toLocaleString("tr-TR")} TL
                  </p>
                </div>
              ))}
            </section>

            {seciliKayit.durum !== "Kapalı" && (
              <>
                <section className="bg-slate-50 rounded-2xl p-4 mb-5">
                  <h3 className="font-black text-slate-900 mb-3">
                    Sahada Ek Hizmet Ekle
                  </h3>

                  <div className="grid md:grid-cols-4 gap-3">
                    <select
                      value={seciliHizmetId}
                      onChange={(e) => hizmetSec(e.target.value)}
                      className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900 md:col-span-2"
                    >
                      <option value="">Hizmet seçiniz</option>
                      {hizmetler.map((hizmet) => (
                        <option key={hizmet.id} value={hizmet.id}>
                          {hizmet.hizmet_adi} - {Number(hizmet.fiyat).toLocaleString("tr-TR")} TL
                        </option>
                      ))}
                    </select>

                    <input
                      value={hizmetAdet}
                      onChange={(e) => setHizmetAdet(e.target.value)}
                      className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                      placeholder="Adet"
                    />

                    <input
                      value={hizmetFiyat}
                      onChange={(e) => setHizmetFiyat(e.target.value)}
                      className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                      placeholder="Fiyat"
                    />
                  </div>

                  <textarea
                    value={hizmetAciklama}
                    onChange={(e) => setHizmetAciklama(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 mt-3"
                    placeholder="Ek hizmet açıklaması"
                  />

                  <button
                    onClick={ekHizmetEkle}
                    className="mt-3 bg-slate-900 text-white px-5 py-3 rounded-xl font-black"
                  >
                    Ek Hizmeti Merkeze Bildir
                  </button>
                </section>

                <section className="bg-emerald-50 rounded-2xl p-4 mb-5">
                  <h3 className="font-black text-slate-900 mb-3">
                    Ödeme Durumu Bildir
                  </h3>

                  <div className="grid md:grid-cols-2 gap-3">
                    <select
                      value={odemeDurumu}
                      onChange={(e) => setOdemeDurumu(e.target.value)}
                      className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                    >
                      {odemeSecenekleri.map((secenek) => (
                        <option key={secenek}>{secenek}</option>
                      ))}
                    </select>

                    <input
                      value={odemeAciklama}
                      onChange={(e) => setOdemeAciklama(e.target.value)}
                      className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                      placeholder="Ödeme açıklaması"
                    />
                  </div>

                  <button
                    onClick={odemeDurumuBildir}
                    className="mt-3 bg-emerald-600 text-white px-5 py-3 rounded-xl font-black"
                  >
                    Ödeme Durumunu Merkeze Bildir
                  </button>
                </section>

                <section className="bg-blue-50 rounded-2xl p-4 mb-5">
                  <h3 className="font-black text-slate-900 mb-3">Hemşire Notu</h3>

                  <textarea
                    value={hemsireNotu}
                    onChange={(e) => setHemsireNotu(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 min-h-28"
                    placeholder="Hasta yanında görülen durum, işlem notu..."
                  />

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={hemsireNotuKaydet}
                      className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black"
                    >
                      Notu Kaydet
                    </button>

                    <button
                      onClick={merkezeOnayaGonder}
                      className="bg-amber-600 text-white px-5 py-3 rounded-xl font-black"
                    >
                      Merkez Onayına Gönder
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
} 