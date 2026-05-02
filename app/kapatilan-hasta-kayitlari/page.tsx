"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/kutuphane/supabase";

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
    hasta_adi: string;
    telefon: string | null;
    adres: string | null;
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

export default function KapatilanHastaKayitlari() {
  const [kayitlar, setKayitlar] = useState<HastaKaydi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliKayit, setSeciliKayit] = useState<HastaKaydi | null>(null);

  useEffect(() => {
    verileriGetir();
  }, []);

  async function verileriGetir() {
    setYukleniyor(true);

    const { data, error } = await supabase
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
        ),
        odemeler (
          id,
          odeme_durumu,
          aciklama,
          olusturma_tarihi
        )
      `)
      .eq("durum", "Kapalı")
      .order("kapanis_tarihi", { ascending: false });

    if (error) {
      console.log("Kapatılan kayıtlar çekilemedi:", error);
      alert("Kapatılan kayıtlar çekilemedi.");
      setYukleniyor(false);
      return;
    }

    setKayitlar((data as HastaKaydi[]) || []);
    setYukleniyor(false);
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

  function toplamHesapla(kayit: HastaKaydi) {
    return (kayit.hasta_hizmetleri || []).reduce((toplam, hizmet) => {
      return toplam + Number(hizmet.adet) * Number(hizmet.birim_fiyat);
    }, 0);
  }

  function tarihFormatla(tarih: string | null) {
    if (!tarih) return "-";
    return new Date(tarih).toLocaleString("tr-TR");
  }

  function yazdir() {
    window.print();
  }

  if (yukleniyor) {
    return <main className="p-10 font-black">Yükleniyor...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white rounded-3xl shadow p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Kapatılan Hasta Kayıtları
            </h1>
            <p className="text-slate-600 mt-1">
              Tamamlanan kayıtlar, hizmetler, ödeme bilgileri ve notlar.
            </p>
          </div>

          <a
            href="/merkez-paneli"
            className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-center"
          >
            Merkez Paneline Dön
          </a>
        </header>

        <section className="bg-white rounded-3xl shadow p-6">
          {kayitlar.length === 0 && (
            <p className="text-slate-500">Kapatılan hasta kaydı bulunmuyor.</p>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kayitlar.map((kayit) => (
              <div key={kayit.id} className="border border-slate-200 rounded-2xl p-5">
                <h2 className="text-xl font-black text-slate-900">
                  {hastaAdiGetir(kayit)}
                </h2>

                <p className="text-sm text-slate-600 mt-1">
                  {hastaTelefonGetir(kayit)}
                </p>

                <p className="text-sm text-slate-600">
                  {hastaAdresGetir(kayit)}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Toplam</p>
                    <p className="font-black">
                      {toplamHesapla(kayit).toLocaleString("tr-TR")} TL
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Ödeme</p>
                    <p className="font-black">{kayit.odeme_durumu}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  Kapanış: {tarihFormatla(kayit.kapanis_tarihi)}
                </p>

                <button
                  onClick={() => setSeciliKayit(kayit)}
                  className="w-full mt-4 bg-slate-900 text-white rounded-xl py-3 font-black"
                >
                  Detayı Aç
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {seciliKayit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:static print:bg-white">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 print:max-h-none print:shadow-none">
            <div className="flex justify-between gap-4 mb-5 print:hidden">
              <button
                onClick={() => setSeciliKayit(null)}
                className="bg-slate-100 px-4 py-2 rounded-xl font-black"
              >
                Kapat
              </button>

              <button
                onClick={yazdir}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black"
              >
                Çıktı Al
              </button>
            </div>

            <h2 className="text-3xl font-black text-slate-900">
              {hastaAdiGetir(seciliKayit)}
            </h2>

            <p className="text-slate-600 mt-1">{hastaTelefonGetir(seciliKayit)}</p>
            <p className="text-slate-600">{hastaAdresGetir(seciliKayit)}</p>

            <div className="grid md:grid-cols-3 gap-3 mt-5">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Toplam</p>
                <p className="text-xl font-black">
                  {toplamHesapla(seciliKayit).toLocaleString("tr-TR")} TL
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Ödeme Durumu</p>
                <p className="text-xl font-black">{seciliKayit.odeme_durumu}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Kapanış Tarihi</p>
                <p className="text-sm font-black">
                  {tarihFormatla(seciliKayit.kapanis_tarihi)}
                </p>
              </div>
            </div>

            <section className="mt-6">
              <h3 className="text-xl font-black mb-3">Hizmetler</h3>

              <div className="space-y-3">
                {seciliKayit.hasta_hizmetleri.map((hizmet) => (
                  <div
                    key={hizmet.id}
                    className="border border-slate-200 rounded-xl p-4 flex justify-between gap-4"
                  >
                    <div>
                      <p className="font-black">{hizmet.hizmet_adi}</p>
                      <p className="text-sm text-slate-500">
                        {hizmet.hizmet_tipi} • {hizmet.aciklama}
                      </p>
                    </div>

                    <p className="font-black">
                      {(Number(hizmet.adet) * Number(hizmet.birim_fiyat)).toLocaleString("tr-TR")} TL
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 rounded-2xl p-4">
                <p className="font-black text-blue-900">Merkez Notu</p>
                <p className="text-blue-900 mt-1">
                  {seciliKayit.merkez_notu || "-"}
                </p>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4">
                <p className="font-black text-amber-900">Hemşire Notu</p>
                <p className="text-amber-900 mt-1">
                  {seciliKayit.hemsire_notu || "-"}
                </p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4">
                <p className="font-black text-emerald-900">Kapanış Notu</p>
                <p className="text-emerald-900 mt-1">
                  {seciliKayit.kapanis_notu || "-"}
                </p>
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}