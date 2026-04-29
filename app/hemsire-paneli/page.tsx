"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/kutuphane/supabase";

type Kullanici = {
  id: string;
  kullanici_adi: string;
  ad_soyad: string;
  rol: "merkez" | "hemsire";
};

type HizmetKatalogu = {
  id: string;
  hizmet_adi: string;
  varsayilan_fiyat: number;
  kategori: string | null;
  aciklama: string | null;
  aktif: boolean;
};

export default function HemsirePaneli() {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [adisyonlar, setAdisyonlar] = useState<any[]>([]);
  const [hizmetler, setHizmetler] = useState<HizmetKatalogu[]>([]);
  const [seciliAdisyon, setSeciliAdisyon] = useState<any | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [seciliHizmetId, setSeciliHizmetId] = useState("");
  const [adet, setAdet] = useState("1");
  const [fiyat, setFiyat] = useState("");
  const [hizmetAciklama, setHizmetAciklama] = useState("");

  const [odemeDurumu, setOdemeDurumu] = useState("Ödeme Alınmadı");
  const [odemeTutari, setOdemeTutari] = useState("");
  const [odemeAciklama, setOdemeAciklama] = useState("");
  const [sahaNotu, setSahaNotu] = useState("");

  useEffect(() => {
    const kayitliKullanici = localStorage.getItem("kullanici");
    if (!kayitliKullanici) {
      window.location.href = "/giris";
      return;
    }

    const aktifKullanici = JSON.parse(kayitliKullanici);
    setKullanici(aktifKullanici);

    if (aktifKullanici.rol !== "hemsire") {
      window.location.href = "/merkez-paneli";
      return;
    }

    verileriGetir(aktifKullanici.id);
  }, []);

  async function verileriGetir(hemsireId?: string) {
    const aktifHemsireId = hemsireId || kullanici?.id;
    if (!aktifHemsireId) return;

    setYukleniyor(true);

    const { data: hizmetData } = await supabase
      .from("geropital_hizmetleri")
      .select("*")
      .eq("aktif", true)
      .order("hizmet_adi");

    const { data: adisyonData } = await supabase
      .from("adisyonlar")
      .select(`
        *,
        hastalar (*),
        hizmetler (*),
        odemeler (*)
      `)
      .eq("hemsire_id", aktifHemsireId)
      .order("olusturma_tarihi", { ascending: false });

    setHizmetler(hizmetData || []);
    setAdisyonlar(adisyonData || []);
    setYukleniyor(false);
  }

  function toplamHesapla(adisyon: any) {
    return (adisyon.hizmetler || []).reduce(
      (toplam: number, h: any) => toplam + Number(h.adet) * Number(h.birim_fiyat),
      0
    );
  }

  function odemeHesapla(adisyon: any) {
    return (adisyon.odemeler || []).reduce(
      (toplam: number, o: any) => toplam + Number(o.tutar),
      0
    );
  }

  function hizmetSec(hizmetId: string) {
    setSeciliHizmetId(hizmetId);
    const hizmet = hizmetler.find((h) => h.id === hizmetId);
    if (hizmet) {
      setFiyat(String(hizmet.varsayilan_fiyat));
      setHizmetAciklama(hizmet.aciklama || "");
    }
  }

  async function ekHizmetEkle() {
    if (!kullanici || !seciliAdisyon) return;

    const hizmet = hizmetler.find((h) => h.id === seciliHizmetId);

    if (!hizmet) {
      alert("Hizmet seçiniz.");
      return;
    }

    await supabase.from("hizmetler").insert({
      adisyon_id: seciliAdisyon.id,
      hizmet_adi: hizmet.hizmet_adi,
      hizmet_tipi: "Sahada Eklenen Hizmet",
      adet: Number(adet),
      birim_fiyat: Number(fiyat),
      ekleyen_kullanici_id: kullanici.id,
      aciklama: hizmetAciklama,
    });

    await supabase
      .from("adisyonlar")
      .update({ durum: "Merkez Onayı Bekliyor" })
      .eq("id", seciliAdisyon.id);

    setSeciliHizmetId("");
    setAdet("1");
    setFiyat("");
    setHizmetAciklama("");

    await verileriGetir();
  }

  async function odemeDurumuBildir() {
    if (!kullanici || !seciliAdisyon) return;

    const tutar = Number(odemeTutari || 0);

    if (odemeDurumu !== "Ödeme Alınmadı" && tutar <= 0) {
      alert("Ödeme alındıysa tutar giriniz.");
      return;
    }

    if (odemeDurumu !== "Ödeme Alınmadı") {
      await supabase.from("odemeler").insert({
        adisyon_id: seciliAdisyon.id,
        tutar,
        odeme_yontemi: odemeDurumu,
        aciklama: odemeAciklama,
        ekleyen_kullanici_id: kullanici.id,
      });
    }

    await supabase
      .from("adisyonlar")
      .update({
        odeme_durumu: odemeDurumu,
        saha_notu: sahaNotu,
        durum: "Merkez Onayı Bekliyor",
      })
      .eq("id", seciliAdisyon.id);

    setOdemeDurumu("Ödeme Alınmadı");
    setOdemeTutari("");
    setOdemeAciklama("");

    await verileriGetir();
    alert("Ödeme durumu merkeze bildirildi.");
  }

  async function sahaNotuKaydet() {
    if (!seciliAdisyon) return;

    await supabase
      .from("adisyonlar")
      .update({ saha_notu: sahaNotu })
      .eq("id", seciliAdisyon.id);

    await verileriGetir();
    alert("Saha notu kaydedildi.");
  }

  function modalAc(adisyon: any) {
    setSeciliAdisyon(adisyon);
    setSahaNotu(adisyon.saha_notu || "");
  }

  if (yukleniyor) {
    return <main className="p-10">Yükleniyor...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 p-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Hemşire Paneli</h1>
            <p className="text-sm text-slate-600">
              Sadece size atanmış hasta adisyonları görünür.
            </p>
          </div>

          <a href="/giris" className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold">
            Çıkış
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-5">
        <section className="bg-white rounded-3xl shadow p-6">
          <h2 className="text-xl font-black mb-4">Atanmış Hasta Adisyonları</h2>

          <div className="grid lg:grid-cols-2 gap-4">
            {adisyonlar.length === 0 && (
              <div className="text-slate-500">Size atanmış açık adisyon bulunmuyor.</div>
            )}

            {adisyonlar.map((a) => {
              const toplam = toplamHesapla(a);
              const odeme = odemeHesapla(a);

              return (
                <div key={a.id} className="border rounded-2xl p-5">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{a.hastalar?.hasta_adi}</h3>
                      <p className="text-sm text-slate-600">{a.hastalar?.telefon}</p>
                      <p className="text-sm text-slate-600">{a.hastalar?.adres}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-black">{a.durum}</p>
                      <p className="text-sm text-slate-600">{a.odeme_durumu}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-xs">Toplam</p>
                      <p className="font-black">{toplam.toLocaleString("tr-TR")} TL</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-xs">Alınan</p>
                      <p className="font-black text-emerald-600">{odeme.toLocaleString("tr-TR")} TL</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-xs">Kalan</p>
                      <p className="font-black text-red-600">{(toplam - odeme).toLocaleString("tr-TR")} TL</p>
                    </div>
                  </div>

                  <button
                    onClick={() => modalAc(a)}
                    className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-black"
                  >
                    Hasta Adisyonunu Aç
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {seciliAdisyon && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6">
            <div className="flex justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-black">{seciliAdisyon.hastalar?.hasta_adi}</h2>
                <p className="text-sm text-slate-600">{seciliAdisyon.hastalar?.adres}</p>
                <p className="text-sm text-slate-600">{seciliAdisyon.merkez_notu}</p>
              </div>

              <button
                onClick={() => setSeciliAdisyon(null)}
                className="bg-slate-100 px-4 py-2 rounded-xl font-black"
              >
                Kapat
              </button>
            </div>

            <section className="space-y-3 mb-5">
              {(seciliAdisyon.hizmetler || []).map((h: any) => (
                <div key={h.id} className="border rounded-xl p-3 flex justify-between">
                  <div>
                    <p className="font-black">{h.hizmet_adi}</p>
                    <p className="text-sm text-slate-500">
                      {h.hizmet_tipi} • {h.aciklama}
                    </p>
                  </div>

                  <p className="font-black">
                    {(Number(h.adet) * Number(h.birim_fiyat)).toLocaleString("tr-TR")} TL
                  </p>
                </div>
              ))}
            </section>

            <section className="bg-slate-50 rounded-2xl p-4 mb-5">
              <h3 className="font-black mb-3">Sahada Ek Hizmet Ekle</h3>

              <div className="grid md:grid-cols-4 gap-3">
                <select
                  value={seciliHizmetId}
                  onChange={(e) => hizmetSec(e.target.value)}
                  className="border rounded-xl px-4 py-3 md:col-span-2"
                >
                  <option value="">Geropital hizmet seçiniz</option>
                  {hizmetler.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hizmet_adi} - {Number(h.varsayilan_fiyat).toLocaleString("tr-TR")} TL
                    </option>
                  ))}
                </select>

                <input
                  value={adet}
                  onChange={(e) => setAdet(e.target.value)}
                  className="border rounded-xl px-4 py-3"
                  placeholder="Adet"
                />

                <input
                  value={fiyat}
                  onChange={(e) => setFiyat(e.target.value)}
                  className="border rounded-xl px-4 py-3"
                  placeholder="Fiyat"
                />
              </div>

              <textarea
                value={hizmetAciklama}
                onChange={(e) => setHizmetAciklama(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 mt-3"
                placeholder="Ek hizmet açıklaması"
              />

              <button onClick={ekHizmetEkle} className="mt-3 bg-slate-900 text-white px-5 py-3 rounded-xl font-black">
                Ek Hizmeti Merkeze Bildir
              </button>
            </section>

            <section className="bg-emerald-50 rounded-2xl p-4 mb-5">
              <h3 className="font-black mb-3">Ödeme Durumu Bildir</h3>

              <div className="grid md:grid-cols-3 gap-3">
                <select
                  value={odemeDurumu}
                  onChange={(e) => setOdemeDurumu(e.target.value)}
                  className="border rounded-xl px-4 py-3"
                >
                  <option>Ödeme Alınmadı</option>
                  <option>Nakit Alındı</option>
                  <option>Kredi Kartı Alındı</option>
                  <option>Havale / EFT Bekleniyor</option>
                  <option>Kısmi Ödeme Alındı</option>
                  <option>Tamamı Ödendi</option>
                </select>

                <input
                  value={odemeTutari}
                  onChange={(e) => setOdemeTutari(e.target.value)}
                  className="border rounded-xl px-4 py-3"
                  placeholder="Alınan tutar"
                />

                <input
                  value={odemeAciklama}
                  onChange={(e) => setOdemeAciklama(e.target.value)}
                  className="border rounded-xl px-4 py-3"
                  placeholder="Ödeme açıklaması"
                />
              </div>

              <button onClick={odemeDurumuBildir} className="mt-3 bg-emerald-600 text-white px-5 py-3 rounded-xl font-black">
                Ödeme Durumunu Merkeze Bildir
              </button>
            </section>

            <section className="bg-blue-50 rounded-2xl p-4">
              <h3 className="font-black mb-3">Saha Notu</h3>

              <textarea
                value={sahaNotu}
                onChange={(e) => setSahaNotu(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 min-h-28"
                placeholder="Hasta yanında görülen durum, işlem notu, ödeme açıklaması..."
              />

              <button onClick={sahaNotuKaydet} className="mt-3 bg-blue-600 text-white px-5 py-3 rounded-xl font-black">
                Saha Notunu Kaydet
              </button>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}