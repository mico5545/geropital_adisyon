"use client";

import { useEffect, useState } from "react";
import { supabaseAl } from "@/kutuphane/supabase";

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
  };
  hasta_hizmetleri: any[];
  odemeler: any[];
};

export default function MerkezPaneli() {
  const supabase = supabaseAl();

  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [hastaKayitlari, setHastaKayitlari] = useState<HastaKaydi[]>([]);
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [bildirimler, setBildirimler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [hastaAdi, setHastaAdi] = useState("");
  const [hastaTelefon, setHastaTelefon] = useState("");
  const [hastaAdresi, setHastaAdresi] = useState("");
  const [merkezNotu, setMerkezNotu] = useState("");

  const [seciliKayit, setSeciliKayit] = useState<HastaKaydi | null>(null);

  const [seciliHizmetId, setSeciliHizmetId] = useState("");
  const [hizmetAdet, setHizmetAdet] = useState("1");
  const [hizmetFiyat, setHizmetFiyat] = useState("");
  const [hizmetAciklama, setHizmetAciklama] = useState("");

  const [yeniHizmetAdi, setYeniHizmetAdi] = useState("");
  const [yeniHizmetFiyat, setYeniHizmetFiyat] = useState("");
  const [yeniHizmetKategori, setYeniHizmetKategori] = useState("");
  const [yeniHizmetAciklama, setYeniHizmetAciklama] = useState("");

  useEffect(() => {
    const kayitliKullanici = localStorage.getItem("kullanici");

    if (!kayitliKullanici) {
      window.location.href = "/giris";
      return;
    }

    const aktifKullanici = JSON.parse(kayitliKullanici);

    if (aktifKullanici.rol !== "merkez") {
      window.location.href = "/hemsire-paneli";
      return;
    }

    setKullanici(aktifKullanici);
    verileriGetir();
  }, []);

  async function verileriGetir() {
    setYukleniyor(true);

    const { data: kayitData, error: kayitHata } = await supabase
      .from("hasta_kayitlari")
      .select(`
        *,
        hastalar (*),
        hasta_hizmetleri (*),
        odemeler (*)
      `)
      .neq("durum", "Kapalı")
      .order("olusturma_tarihi", { ascending: false });

    if (kayitHata) {
      console.log("Hasta kayıtları çekilemedi:", kayitHata);
    }

    const { data: hizmetData, error: hizmetHata } = await supabase
      .from("hizmet_katalogu")
      .select("*")
      .order("hizmet_adi", { ascending: true });

    if (hizmetHata) {
      console.log("Hizmetler çekilemedi:", hizmetHata);
    }

    const { data: bildirimData, error: bildirimHata } = await supabase
      .from("bildirimler")
      .select("*")
      .eq("okundu", false)
      .order("olusturma_tarihi", { ascending: false });

    if (bildirimHata) {
      console.log("Bildirimler çekilemedi:", bildirimHata);
    }

    setHastaKayitlari(kayitData || []);
    setHizmetler(hizmetData || []);
    setBildirimler(bildirimData || []);
    setYukleniyor(false);
  }

  async function hastaKaydiAc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!kullanici) {
      alert("Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
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

    const { error: kayitHata } = await supabase
      .from("hasta_kayitlari")
      .insert({
        hasta_id: hasta.id,
        hemsire_id: null,
        acan_kullanici_id: kullanici.id,
        durum: "Aktif",
        odeme_durumu: "Tamamı Alınmadı",
        merkez_notu: merkezNotu,
        hemsire_notu: "",
        kapanis_notu: "",
      });

    if (kayitHata) {
      console.log("Hasta kaydı oluşturma hatası:", kayitHata);
      alert("Hasta kaydı oluşturulamadı. Konsolu kontrol edin.");
      return;
    }

    alert("Hasta kaydı oluşturuldu.");

    setHastaAdi("");
    setHastaTelefon("");
    setHastaAdresi("");
    setMerkezNotu("");

    await verileriGetir();
  }

  function toplamTutarHesapla(kayit: HastaKaydi) {
    return (kayit.hasta_hizmetleri || []).reduce((toplam, hizmet) => {
      return toplam + Number(hizmet.adet) * Number(hizmet.birim_fiyat);
    }, 0);
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
      adet: Number(hizmetAdet),
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
      console.log("Hizmet ekleme hatası:", error);
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
      .update({
        fiyat: Number(yeniFiyat),
      })
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
      .update({
        aktif: !hizmet.aktif,
      })
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
      .update({
        durum: "Aktif",
      })
      .eq("id", kayitId);

    if (error) {
      console.log("Onay hatası:", error);
      alert("Onay verilemedi.");
      return;
    }

    await supabase
      .from("bildirimler")
      .update({
        okundu: true,
      })
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

  if (yukleniyor) {
    return <main className="p-10">Yükleniyor...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 p-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Geropital İş Talimatı
            </h1>
            <p className="text-sm text-slate-600">
              Merkez hasta kaydı, hizmet yönetimi ve onay ekranı
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="/kapatilan-hasta-kayitlari"
              className="bg-slate-100 text-slate-900 px-4 py-2 rounded-xl font-bold"
            >
              Kapatılan Kayıtlar
            </a>

            <a
              href="/giris"
              className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold"
            >
              Çıkış
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-5">
        {bildirimler.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-6">
            <h2 className="text-xl font-black text-amber-900 mb-3">
              Merkez Onayı Bekleyen Bildirimler
            </h2>

            <div className="space-y-3">
              {bildirimler.map((bildirim) => (
                <div
                  key={bildirim.id}
                  className="bg-white rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-black text-slate-900">{bildirim.baslik}</p>
                    <p className="text-sm text-slate-600">{bildirim.mesaj}</p>
                  </div>

                  <button
                    onClick={() => merkezOnayiVer(bildirim.hasta_kaydi_id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"
                  >
                    Onayla
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="bg-white rounded-3xl shadow p-6 h-fit">
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

              <textarea
                value={merkezNotu}
                onChange={(e) => setMerkezNotu(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 min-h-24"
                placeholder="Merkez notu"
              />

              <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-black">
                Hasta Kaydı Aç
              </button>
            </form>
          </section>

          <section className="lg:col-span-2 bg-white rounded-3xl shadow p-6">
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
                  <div key={kayit.id} className="border border-slate-200 rounded-2xl p-5">
                    <div className="flex flex-col md:flex-row md:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">
                          {kayit.hastalar?.hasta_adi}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {kayit.hastalar?.telefon || "Telefon yok"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {kayit.hastalar?.adres || "Adres yok"}
                        </p>
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
                      onClick={() => setSeciliKayit(kayit)}
                      className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-black"
                    >
                      Detayı Aç
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-3 bg-white rounded-3xl shadow p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              Hizmet Yönetimi
            </h2>

            <form
              onSubmit={hizmetKatalogunaEkle}
              className="grid md:grid-cols-5 gap-3 mb-5"
            >
              <input
                value={yeniHizmetAdi}
                onChange={(e) => setYeniHizmetAdi(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                placeholder="Hizmet adı"
              />

              <input
                value={yeniHizmetFiyat}
                onChange={(e) => setYeniHizmetFiyat(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                placeholder="Fiyat"
              />

              <input
                value={yeniHizmetKategori}
                onChange={(e) => setYeniHizmetKategori(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                placeholder="Kategori"
              />

              <input
                value={yeniHizmetAciklama}
                onChange={(e) => setYeniHizmetAciklama(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                placeholder="Açıklama"
              />

              <button className="bg-blue-600 text-white rounded-xl font-black">
                Hizmet Ekle
              </button>
            </form>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hizmetler.map((hizmet) => (
                <div key={hizmet.id} className="border border-slate-200 rounded-2xl p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-900">
                        {hizmet.hizmet_adi}
                      </h3>
                      <p className="text-sm text-slate-500">{hizmet.kategori}</p>
                      <p className="text-sm text-slate-500">{hizmet.aciklama}</p>
                    </div>

                    <p className="font-black text-slate-900">
                      {Number(hizmet.fiyat).toLocaleString("tr-TR")} TL
                    </p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => hizmetFiyatGuncelle(hizmet)}
                      className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-bold"
                    >
                      Fiyat Düzenle
                    </button>

                    <button
                      onClick={() => hizmetAktifPasifYap(hizmet)}
                      className={`px-3 py-2 rounded-xl text-sm font-bold ${
                        hizmet.aktif
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {hizmet.aktif ? "Pasif Yap" : "Aktif Yap"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {seciliKayit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6">
            <div className="flex justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {seciliKayit.hastalar?.hasta_adi}
                </h2>
                <p className="text-sm text-slate-600">
                  {seciliKayit.hastalar?.telefon}
                </p>
                <p className="text-sm text-slate-600">
                  {seciliKayit.hastalar?.adres}
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

              {(seciliKayit.hasta_hizmetleri || []).map((hizmet: any) => (
                <div
                  key={hizmet.id}
                  className="border border-slate-200 rounded-xl p-3 flex justify-between gap-3"
                >
                  <div>
                    <p className="font-black text-slate-900">{hizmet.hizmet_adi}</p>
                    <p className="text-sm text-slate-500">
                      {hizmet.hizmet_tipi} • {hizmet.aciklama}
                    </p>
                  </div>

                  <p className="font-black text-slate-900">
                    {(Number(hizmet.adet) * Number(hizmet.birim_fiyat)).toLocaleString(
                      "tr-TR"
                    )}{" "}
                    TL
                  </p>
                </div>
              ))}
            </section>

            <section className="bg-slate-50 rounded-2xl p-4 mb-5">
              <h3 className="font-black text-slate-900 mb-3">Merkez Hizmeti Ekle</h3>

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
                className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black"
              >
                Merkez Onayı Ver
              </button>

              <button
                onClick={() => hastaKaydiKapat(seciliKayit.id)}
                className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black"
              >
                Hasta Kaydını Kapat
              </button>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}