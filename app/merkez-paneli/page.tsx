"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/kutuphane/supabase";
import KurumsalLogo from "@/bilesenler/KurumsalLogo";
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

type Bildirim = {
  id: string;
  hasta_kaydi_id: string;
  baslik: string;
  mesaj: string | null;
  okundu: boolean;
  olusturma_tarihi: string;
};

export default function MerkezPaneli() {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [hastaKayitlari, setHastaKayitlari] = useState<HastaKaydi[]>([]);
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [hemsireler, setHemsireler] = useState<Kullanici[]>([]);
  const [hemsireId, setHemsireId] = useState("");
  const [seciliKayit, setSeciliKayit] = useState<HastaKaydi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sonBildirimSayisi, setSonBildirimSayisi] = useState(0);
  const oncekiBildirimSayisi = useRef(0);
  const sesAktifRef = useRef(false);
  const [sesAktif, setSesAktif] = useState(false);

  const [hastaAdi, setHastaAdi] = useState("");
  const [hastaTelefon, setHastaTelefon] = useState("");
  const [hastaAdresi, setHastaAdresi] = useState("");
  const [merkezNotu, setMerkezNotu] = useState("");

  const [seciliHizmetId, setSeciliHizmetId] = useState("");
  const [hizmetAdet, setHizmetAdet] = useState("1");
  const [hizmetFiyat, setHizmetFiyat] = useState("");
  const [hizmetAciklama, setHizmetAciklama] = useState("");

  const [yeniHizmetAdi, setYeniHizmetAdi] = useState("");
  const [yeniHizmetFiyat, setYeniHizmetFiyat] = useState("");
  const [yeniHizmetKategori, setYeniHizmetKategori] = useState("");
  const [yeniHizmetAciklama, setYeniHizmetAciklama] = useState("");

  const [toastMesaji, setToastMesaji] = useState("");

  const [duzenlenenHizmet, setDuzenlenenHizmet] = useState<Hizmet | null>(null);
  const [duzenleHizmetAdi, setDuzenleHizmetAdi] = useState("");
  const [duzenleHizmetFiyat, setDuzenleHizmetFiyat] = useState("");
  const [duzenleHizmetKategori, setDuzenleHizmetKategori] = useState("");
  const [duzenleHizmetAciklama, setDuzenleHizmetAciklama] = useState("");

  useEffect(() => {
    const kayitliKullanici = localStorage.getItem("kullanici");

    if (!kayitliKullanici) {
      window.location.href = "/giris";
      return;
    }

    const aktifKullanici = JSON.parse(kayitliKullanici);

    setKullanici(aktifKullanici);

    verileriGetir();

    const bildirimKontrol = setInterval(async () => {
      const { data, error } = await supabase
        .from("bildirimler")
        .select("id")
        .eq("okundu", false);

      if (error) {
        console.log("Bildirim kontrol hatası:", error);
        return;
      }

      const yeniBildirimSayisi = data?.length || 0;

      if (
        sesAktifRef.current &&
        oncekiBildirimSayisi.current > 0 &&
        yeniBildirimSayisi > oncekiBildirimSayisi.current
      ) {
        bildirimSesiCal();
        toastGoster("Yeni hemşire bildirimi geldi. Kontrol etmeniz gerekiyor.");
        await verileriGetir();
      }

      oncekiBildirimSayisi.current = yeniBildirimSayisi;
    }, 3000);

    return () => {
      clearInterval(bildirimKontrol);
    };
  }, []);

  async function verileriGetir() {
    setYukleniyor(true);

    const { data: kayitData, error: kayitHata } = await supabase
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
      .order("olusturma_tarihi", { ascending: false });

    const { data: hizmetData, error: hizmetHata } = await supabase
      .from("hizmet_katalogu")
      .select("*")
      .order("hizmet_adi", { ascending: true });

    const { data: bildirimData, error: bildirimHata } = await supabase
      .from("bildirimler")
      .select("*")
      .eq("okundu", false)
      .order("olusturma_tarihi", { ascending: false });

    const { data: hemsireData, error: hemsireHata } = await supabase
      .from("kullanicilar")
      .select("*")
      .eq("rol", "hemsire")
      .eq("aktif", true)
      .order("ad_soyad");

    if (kayitHata) console.log("Hasta kayıtları çekilemedi:", kayitHata);
    if (hizmetHata) console.log("Hizmetler çekilemedi:", hizmetHata);
    if (bildirimHata) console.log("Bildirimler çekilemedi:", bildirimHata);
    if (hemsireHata) console.log("Hemşireler çekilemedi:", hemsireHata);

    setHastaKayitlari((kayitData as HastaKaydi[]) || []);
    setHizmetler((hizmetData as Hizmet[]) || []);
    setBildirimler((bildirimData as Bildirim[]) || []);
    setHemsireler((hemsireData as Kullanici[]) || []);
    setYukleniyor(false);
  }

  function bildirimSesiniAktifEt() {
    sesAktifRef.current = !sesAktifRef.current;
    setSesAktif(!sesAktif);
    
    if (sesAktifRef.current) {
      bildirimSesiCal();
    }
  }

  function toastGoster(mesaj: string) {
    setToastMesaji(mesaj);

    setTimeout(() => {
      setToastMesaji("");
    }, 5000);
  }

  function bildirimSesiCal() {
    if (!sesAktifRef.current) return;

    try {
      const audioContext = new AudioContext();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";

      const t = audioContext.currentTime;

      // 1. ding
      oscillator.frequency.setValueAtTime(880, t);
      gainNode.gain.setValueAtTime(0.2, t);

      // 2. ding (yumuşak tekrar)
      oscillator.frequency.setValueAtTime(660, t + 0.4);

      // fade out
      gainNode.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

      oscillator.start(t);
      oscillator.stop(t + 1.2);
    } catch (err) {
      console.log("Ses hatası:", err);
    }
  }

  function hizmetDuzenlemeAc(hizmet: Hizmet) {
    setDuzenlenenHizmet(hizmet);
    setDuzenleHizmetAdi(hizmet.hizmet_adi);
    setDuzenleHizmetFiyat(String(hizmet.fiyat));
    setDuzenleHizmetKategori(hizmet.kategori || "");
    setDuzenleHizmetAciklama(hizmet.aciklama || "");
  }

  async function hizmetDuzenleKaydet() {
    if (!duzenlenenHizmet) return;

    if (!duzenleHizmetAdi.trim()) {
      alert("Hizmet adı zorunludur.");
      return;
    }

    const { error } = await supabase
      .from("hizmet_katalogu")
      .update({
        hizmet_adi: duzenleHizmetAdi,
        fiyat: Number(duzenleHizmetFiyat || 0),
        kategori: duzenleHizmetKategori,
        aciklama: duzenleHizmetAciklama,
      })
      .eq("id", duzenlenenHizmet.id);

    if (error) {
      console.log("Hizmet düzenleme hatası:", error);
      alert("Hizmet düzenlenemedi.");
      return;
    }

    setDuzenlenenHizmet(null);
    await verileriGetir();
    alert("Hizmet güncellendi.");
  }

  function toplamTutarHesapla(kayit: HastaKaydi) {
    return (kayit.hasta_hizmetleri || []).reduce((toplam, hizmet) => {
      return toplam + Number(hizmet.adet) * Number(hizmet.birim_fiyat);
    }, 0);
  }

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

  async function hastaKaydiAc(e: React.FormEvent<HTMLFormElement>) {
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
        hemsire_id: hemsireId || null,
        acan_kullanici_id: kullanici.id,
        durum: "Aktif",
        odeme_durumu: "Tamamı Alınmadı",
        merkez_notu: merkezNotu,
        hemsire_notu: "",
        kapanis_notu: "",
      })
      .select()
      .single();

    if (kayitHata || !kayit) {
      console.log("Hasta kaydı oluşturma hatası:", kayitHata);
      alert("Hasta kaydı oluşturulamadı.");
      return;
    }

    if (seciliHizmetId) {
      const { error: hizmetHata } = await supabase
        .from("hasta_hizmetleri")
        .insert({
          hasta_kaydi_id: kayit.id,
          hizmet_adi: hizmetler.find((h) => h.id === seciliHizmetId)?.hizmet_adi || "",
          hizmet_tipi: "Merkez Kaydı",
          adet: Number(hizmetAdet),
          birim_fiyat: Number(hizmetFiyat),
          aciklama: hizmetAciklama || "",
        });

      if (hizmetHata) {
        console.log("Hizmet ekleme hatası:", hizmetHata);
      }
    }

    setHastaAdi("");
    setHastaTelefon("");
    setHastaAdresi("");
    setHemsireId("");
    setMerkezNotu("");
    setSeciliHizmetId("");
    setHizmetAdet("1");
    setHizmetFiyat("");
    setHizmetAciklama("");

    await verileriGetir();
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

  async function hizmetEkle() {
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
      hizmet_tipi: "Merkez Hizmeti",
      adet: Number(hizmetAdet || 1),
      birim_fiyat: Number(hizmetFiyat),
      ekleyen_kullanici_id: kullanici.id,
      aciklama: hizmetAciklama,
    });

    if (error) {
      console.log("Hizmet ekleme hatası:", error);
      alert("Hizmet eklenemedi.");
      return;
    }

    setSeciliHizmetId("");
    setHizmetAdet("1");
    setHizmetFiyat("");
    setHizmetAciklama("");

    await verileriGetir();
    alert("Hizmet eklendi.");
  }

  async function hizmetKatalogunaEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!yeniHizmetAdi.trim()) {
      alert("Hizmet adı zorunludur.");
      return;
    }

    const { error } = await supabase.from("hizmet_katalogu").insert({
      hizmet_adi: yeniHizmetAdi,
      fiyat: Number(yeniHizmetFiyat || 0),
      kategori: yeniHizmetKategori,
      aciklama: yeniHizmetAciklama,
      aktif: true,
    });

    if (error) {
      console.log("Hizmet katalog ekleme hatası:", error);
      alert("Hizmet eklenemedi.");
      return;
    }

    setYeniHizmetAdi("");
    setYeniHizmetFiyat("");
    setYeniHizmetKategori("");
    setYeniHizmetAciklama("");

    await verileriGetir();
  }

  async function hizmetFiyatGuncelle(hizmet: Hizmet) {
    const yeniFiyat = prompt("Yeni fiyat giriniz:", String(hizmet.fiyat));
    if (!yeniFiyat) return;

    const { error } = await supabase
      .from("hizmet_katalogu")
      .update({ fiyat: Number(yeniFiyat) })
      .eq("id", hizmet.id);

    if (error) {
      console.log("Fiyat güncelleme hatası:", error);
      alert("Fiyat güncellenemedi.");
      return;
    }

    await verileriGetir();
  }

  async function hizmetAktifPasifYap(hizmet: Hizmet) {
    const { error } = await supabase
      .from("hizmet_katalogu")
      .update({ aktif: !hizmet.aktif })
      .eq("id", hizmet.id);

    if (error) {
      console.log("Aktif/pasif hatası:", error);
      alert("İşlem yapılamadı.");
      return;
    }

    await verileriGetir();
  }

  async function merkezOnayiVer(kayitId: string) {
    const { error } = await supabase
      .from("hasta_kayitlari")
      .update({ durum: "Aktif" })
      .eq("id", kayitId);

    if (error) {
      console.log("Onay hatası:", error);
      alert("Onay verilemedi.");
      return;
    }

    await supabase
      .from("bildirimler")
      .update({ okundu: true })
      .eq("hasta_kaydi_id", kayitId);

    await verileriGetir();
    alert("Merkez onayı verildi.");
  }

  async function hastaKaydiKapat(kayitId: string) {
    const kapanisNotu = prompt("Kapanış notu giriniz:");
    const { error } = await supabase
      .from("hasta_kayitlari")
      .update({
        durum: "Kapalı",
        kapanis_notu: kapanisNotu || "",
        kapanis_tarihi: new Date().toISOString(),
      })
      .eq("id", kayitId);

    if (error) {
      console.log("Kapatma hatası:", error);
      alert("Hasta kaydı kapatılamadı.");
      return;
    }

    setSeciliKayit(null);
    await verileriGetir();
    alert("Hasta kaydı kapatıldı.");
  }

  function cikisYap() {
    localStorage.removeItem("kullanici");
    window.location.href = "/giris";
  }

  return (
    <main className="min-h-screen kurumsal-arka-plan">
      <section className="border-b border-[#144a7b]/10 py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-5">
          <h1 className="text-3xl lg:text-4xl font-black text-[#144a7b] mb-2">Hasta Kaydı</h1>
          <p className="text-sm text-slate-600">Merkez hasta kaydı, saha planı, hizmet ve bildirim yönetimi</p>
        </div>
      </section>

      <KurumsalHeader
        linkler={[
          { href: "/merkez-paneli", label: "Merkez Paneli" },
          { href: "/gunluk-saha-plani", label: "Günlük Saha Planı" },
          { href: "/hizmet-yonetimi", label: "Hizmet Yönetimi" },
          { href: "/bildirimler", label: `Bildirimler (${bildirimler.length})` },
          { href: "/kapatilan-hasta-kayitlari", label: "Kapatılan Kayıtlar" },
        ]}
        sagAlan={
          <div className="flex gap-3">
            <button
              onClick={bildirimSesiniAktifEt}
              className={`px-4 py-2 rounded-xl font-bold transition ${
                sesAktif
                  ? "bg-green-100 text-green-900 hover:bg-green-200"
                  : "bg-red-100 text-red-900 hover:bg-red-200"
              }`}
            >
              {sesAktif ? "Ses Aktif" : "Sesi Aktif Et"}
            </button>

            <button
              onClick={cikisYap}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold transition hover:bg-slate-800"
            >
              Çıkış
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto p-5">
        {bildirimler.length > 0 && (
          <section className="kurumsal-kart kurumsal-hover rounded-3xl p-6 mb-6 border-l-4 border-l-amber-500 yumusak-giris">
            <h2 className="text-lg font-black text-slate-900 mb-4">
              ⚠️ Merkez Onayı Bekleyen Bildirimler
            </h2>

            <div className="space-y-3">
              {bildirimler.map((bildirim) => (
                <div
                  key={bildirim.id}
                  className="kurumsal-hover rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-amber-100 bg-amber-50/40"
                >
                  <div>
                    <p className="font-bold text-slate-900">
                      {bildirim.baslik}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">{bildirim.mesaj}</p>
                  </div>

                  <button
                    onClick={() => merkezOnayiVer(bildirim.hasta_kaydi_id)}
                    className="kurumsal-buton px-5 py-2 rounded-xl font-bold text-sm flex-shrink-0"
                  >
                    Onayla
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="kurumsal-kart kurumsal-hover rounded-3xl p-6 h-fit yumusak-giris">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              Yeni Hasta Kaydı Aç
            </h2>

            <form onSubmit={hastaKaydiAc} className="space-y-3">
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

              <select
                value={hemsireId}
                onChange={(e) => setHemsireId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                <option value="">Hemşire seçiniz</option>
                {hemsireler.map((hemsire) => (
                  <option key={hemsire.id} value={hemsire.id}>
                    {hemsire.ad_soyad}
                  </option>
                ))}
              </select>

              <select
                value={seciliHizmetId}
                onChange={(e) => hizmetSec(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                <option value="">Hizmet seçiniz </option>
                {hizmetler.filter((h) => h.aktif).map((hizmet) => (
                  <option key={hizmet.id} value={hizmet.id}>
                    {hizmet.hizmet_adi} - {hizmet.fiyat} TL
                  </option>
                ))}
              </select>

              <textarea
                value={merkezNotu}
                onChange={(e) => setMerkezNotu(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 min-h-24"
                placeholder="Merkez notu"
              />

              <button className="w-full kurumsal-buton rounded-xl py-3 font-bold">
                Hasta Kaydı Aç
              </button>
            </form>
          </section>

          <section className="lg:col-span-2 kurumsal-kart kurumsal-hover rounded-3xl p-6 yumusak-giris">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              Aktif Hasta Kayıtları
            </h2>

            <div className="space-y-4">
              {hastaKayitlari.length === 0 && (
                <p className="text-slate-500">Aktif hasta kaydı bulunmuyor.</p>
              )}

              {hastaKayitlari.map((kayit) => {
                const toplam = toplamTutarHesapla(kayit);

                return (
                  <div
                    key={kayit.id}
                    className="kurumsal-kart kurumsal-hover rounded-2xl p-5 cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">
                          {hastaAdiGetir(kayit)}
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
                        <p className="text-sm text-slate-600">
                          {kayit.odeme_durumu}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3 mt-4">
                      <div className="bg-[#f4f8fc] border border-[#144a7b]/10 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Toplam Tutar</p>
                        <p className="font-black text-slate-900">
                          {toplam.toLocaleString("tr-TR")} TL
                        </p>
                      </div>

                      <div className="bg-[#f4f8fc] border border-[#144a7b]/10 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Ödeme Durumu</p>
                        <p className="font-black text-slate-900">
                          {kayit.odeme_durumu}
                        </p>
                      </div>

                      <div className="bg-[#f4f8fc] border border-[#144a7b]/10 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Durum</p>
                        <p className="font-black text-slate-900">{kayit.durum}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSeciliKayit(kayit)}
                      className="w-full mt-4 kurumsal-buton py-3 rounded-xl font-bold"
                    >
                      Detayları Aç
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {seciliKayit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="kurumsal-kart kurumsal-hover rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6">
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
                <div
                  key={hizmet.id}
                  className="border border-slate-200 rounded-xl p-3 flex justify-between gap-3"
                >
                  <div>
                    <p className="font-black text-slate-900">
                      {hizmet.hizmet_adi}
                    </p>
                    <p className="text-sm text-slate-500">
                      {hizmet.hizmet_tipi} • {hizmet.aciklama}
                    </p>
                  </div>

                  <p className="font-black text-slate-900">
                    {(
                      Number(hizmet.adet) * Number(hizmet.birim_fiyat)
                    ).toLocaleString("tr-TR")}{" "}
                    TL
                  </p>
                </div>
              ))}
            </section>

            <section className="bg-slate-50 rounded-2xl p-4 mb-5">
              <h3 className="font-black text-slate-900 mb-3">
                Merkez Hizmeti Ekle
              </h3>

              <div className="grid md:grid-cols-4 gap-3">
                <select
                  value={seciliHizmetId}
                  onChange={(e) => hizmetSec(e.target.value)}
                  className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900 md:col-span-2"
                >
                  <option value="">Hizmet seçiniz</option>
                  {hizmetler
                    .filter((h) => h.aktif)
                    .map((hizmet) => (
                      <option key={hizmet.id} value={hizmet.id}>
                        {hizmet.hizmet_adi} -{" "}
                        {Number(hizmet.fiyat).toLocaleString("tr-TR")} TL
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
                placeholder="Açıklama"
              />

              <button
                onClick={hizmetEkle}
                className="mt-3 bg-slate-900 text-white px-5 py-3 rounded-xl font-black"
              >
                Hizmeti Ekle
              </button>
            </section>

            <section className="flex flex-wrap gap-2">
              <button
                onClick={() => merkezOnayiVer(seciliKayit.id)}
                className="kurumsal-buton px-5 py-3 rounded-xl font-black"
              >
                Merkez Onayı Ver
              </button>

              <button
                onClick={() => hastaKaydiKapat(seciliKayit.id)}
                className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black transition hover:bg-emerald-700"
              >
                Hasta Kaydını Kapat
              </button>
            </section>
          </div>
        </div>
      )}

      {toastMesaji && (
        <div className="fixed right-5 top-5 z-[9999] w-[calc(100%-40px)] max-w-md rounded-2xl bg-slate-950 text-white shadow-2xl border border-slate-700 p-5 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 mt-2"></div>

            <div>
              <p className="font-black text-lg">Yeni Bildirim</p>
              <p className="text-sm text-slate-200 mt-1">{toastMesaji}</p>

              <a
                href="/bildirimler"
                className="inline-block mt-3 bg-white text-slate-950 px-4 py-2 rounded-xl font-black text-sm"
              >
                Bildirimlere Git
              </a>
            </div>
          </div>
        </div>
      )}

      {duzenlenenHizmet && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
          <div className="kurumsal-kart kurumsal-hover rounded-3xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Hizmet Düzenle
                </h2>
                <p className="text-sm text-slate-600">
                  Hizmet adı, fiyatı, kategorisi ve açıklaması merkez tarafından düzenlenir.
                </p>
              </div>

              <button
                onClick={() => setDuzenlenenHizmet(null)}
                className="bg-slate-100 text-slate-900 px-4 py-2 rounded-xl font-black"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={duzenleHizmetAdi}
                onChange={(e) => setDuzenleHizmetAdi(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                placeholder="Hizmet adı"
              />

              <input
                value={duzenleHizmetFiyat}
                onChange={(e) => setDuzenleHizmetFiyat(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                placeholder="Fiyat"
              />

              <input
                value={duzenleHizmetKategori}
                onChange={(e) => setDuzenleHizmetKategori(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                placeholder="Kategori"
              />

              <textarea
                value={duzenleHizmetAciklama}
                onChange={(e) => setDuzenleHizmetAciklama(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 min-h-28"
                placeholder="Açıklama"
              />

              <button
                onClick={hizmetDuzenleKaydet}
                className="w-full kurumsal-buton rounded-xl py-3 font-black"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}