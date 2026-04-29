"use client";

import { useEffect, useState } from "react";
import { supabaseAl } from "@/kutuphane/supabase";

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

export default function MerkezPaneli() {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [hemsireler, setHemsireler] = useState<Kullanici[]>([]);
  const [adisyonlar, setAdisyonlar] = useState<any[]>([]);
  const [hizmetler, setHizmetler] = useState<HizmetKatalogu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [hastaAdi, setHastaAdi] = useState("");
  const [hastaTelefon, setHastaTelefon] = useState("");
  const [hastaAdresi, setHastaAdresi] = useState("");
  const [hemsireId, setHemsireId] = useState("");
  const [merkezNotu, setMerkezNotu] = useState("");

  const [seciliAdisyon, setSeciliAdisyon] = useState<any | null>(null);

  const [seciliHizmetId, setSeciliHizmetId] = useState("");
  const [adet, setAdet] = useState("1");
  const [fiyat, setFiyat] = useState("");
  const [hizmetAciklama, setHizmetAciklama] = useState("");

  const [yeniHizmetAdi, setYeniHizmetAdi] = useState("");
  const [yeniHizmetFiyat, setYeniHizmetFiyat] = useState("");
  const [yeniHizmetKategori, setYeniHizmetKategori] = useState("");
  const [yeniHizmetAciklama, setYeniHizmetAciklama] = useState("");
  const supabase = supabaseAl();
  useEffect(() => {
    const kayitliKullanici = localStorage.getItem("kullanici");
    if (!kayitliKullanici) {
      window.location.href = "/giris";
      return;
    }

    const aktifKullanici = JSON.parse(kayitliKullanici);
    setKullanici(aktifKullanici);

    if (aktifKullanici.rol !== "merkez") {
      window.location.href = "/hemsire-paneli";
      return;
    }

    verileriGetir();
  }, []);

  async function verileriGetir() {
    setYukleniyor(true);

    const { data: hemsireData } = await supabase
      .from("kullanicilar")
      .select("*")
      .eq("rol", "hemsire")
      .eq("aktif", true)
      .order("ad_soyad");

    const { data: hizmetData } = await supabase
      .from("geropital_hizmetleri")
      .select("*")
      .order("hizmet_adi");

    const { data: adisyonData } = await supabase
      .from("adisyonlar")
      .select(`
        *,
        hastalar (*),
        hemsire:kullanicilar!adisyonlar_hemsire_id_fkey (*),
        hizmetler (*),
        odemeler (*)
      `)
      .order("olusturma_tarihi", { ascending: false });

    setHemsireler(hemsireData || []);
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

  async function adisyonAc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!kullanici) return;

    if (!hastaAdi || !hemsireId) {
      alert("Hasta adı ve hemşire seçimi zorunludur.");
      return;
    }

    const { data: hasta, error: hastaHata } = await supabase
      .from("hastalar")
      .insert({
        hasta_adi: hastaAdi,
        telefon: hastaTelefon,
        adres: hastaAdresi,
      })
      .select()
      .single();

    if (hastaHata || !hasta) {
      alert("Hasta oluşturulamadı.");
      return;
    }

    const { error: adisyonHata } = await supabase.from("adisyonlar").insert({
      hasta_id: hasta.id,
      hemsire_id: hemsireId,
      acan_kullanici_id: kullanici.id,
      durum: "Açık",
      odeme_durumu: "Ödeme Bekliyor",
      merkez_notu: merkezNotu,
    });

    if (adisyonHata) {
      alert("Adisyon oluşturulamadı.");
      return;
    }

    setHastaAdi("");
    setHastaTelefon("");
    setHastaAdresi("");
    setHemsireId("");
    setMerkezNotu("");

    await verileriGetir();
  }

  function hizmetSec(hizmetId: string) {
    setSeciliHizmetId(hizmetId);
    const hizmet = hizmetler.find((h) => h.id === hizmetId);
    if (hizmet) {
      setFiyat(String(hizmet.varsayilan_fiyat));
      setHizmetAciklama(hizmet.aciklama || "");
    }
  }

  async function adisyonaHizmetEkle() {
    if (!kullanici || !seciliAdisyon) return;

    const hizmet = hizmetler.find((h) => h.id === seciliHizmetId);

    if (!hizmet) {
      alert("Hizmet seçiniz.");
      return;
    }

    await supabase.from("hizmetler").insert({
      adisyon_id: seciliAdisyon.id,
      hizmet_adi: hizmet.hizmet_adi,
      hizmet_tipi: "Merkez Hizmeti",
      adet: Number(adet),
      birim_fiyat: Number(fiyat),
      ekleyen_kullanici_id: kullanici.id,
      aciklama: hizmetAciklama,
    });

    setSeciliHizmetId("");
    setAdet("1");
    setFiyat("");
    setHizmetAciklama("");

    await verileriGetir();
  }

  async function odemeDurumuGuncelle(adisyonId: string, durum: string) {
    await supabase
      .from("adisyonlar")
      .update({ odeme_durumu: durum })
      .eq("id", adisyonId);

    await verileriGetir();
  }

  async function adisyonDurumuGuncelle(adisyonId: string, durum: string) {
    await supabase
      .from("adisyonlar")
      .update({ durum })
      .eq("id", adisyonId);

    await verileriGetir();
  }

  async function hizmetKatalogunaEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!yeniHizmetAdi || !yeniHizmetFiyat) {
      alert("Hizmet adı ve fiyat zorunludur.");
      return;
    }

    await supabase.from("geropital_hizmetleri").insert({
      hizmet_adi: yeniHizmetAdi,
      varsayilan_fiyat: Number(yeniHizmetFiyat),
      kategori: yeniHizmetKategori,
      aciklama: yeniHizmetAciklama,
      aktif: true,
    });

    setYeniHizmetAdi("");
    setYeniHizmetFiyat("");
    setYeniHizmetKategori("");
    setYeniHizmetAciklama("");

    await verileriGetir();
  }

  async function hizmetAktifPasifYap(hizmet: HizmetKatalogu) {
    await supabase
      .from("geropital_hizmetleri")
      .update({ aktif: !hizmet.aktif })
      .eq("id", hizmet.id);

    await verileriGetir();
  }

  async function hizmetFiyatGuncelle(hizmet: HizmetKatalogu) {
    const yeniFiyat = prompt("Yeni fiyat:", String(hizmet.varsayilan_fiyat));
    if (!yeniFiyat) return;

    await supabase
      .from("geropital_hizmetleri")
      .update({ varsayilan_fiyat: Number(yeniFiyat) })
      .eq("id", hizmet.id);

    await verileriGetir();
  }

  if (yukleniyor) {
    return <main className="p-10">Yükleniyor...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 p-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Merkez Paneli</h1>
            <p className="text-sm text-slate-600">Adisyon, hizmet ve ödeme yönetimi</p>
          </div>

          <a href="/giris" className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold">
            Çıkış
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-5 grid lg:grid-cols-3 gap-6">
        <section className="bg-white rounded-3xl shadow p-6 h-fit">
          <h2 className="text-xl font-black mb-4">Yeni Adisyon Aç</h2>

          <form onSubmit={adisyonAc} className="space-y-3">
            <input
              value={hastaAdi}
              onChange={(e) => setHastaAdi(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Hasta adı soyadı"
            />

            <input
              value={hastaTelefon}
              onChange={(e) => setHastaTelefon(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Telefon"
            />

            <textarea
              value={hastaAdresi}
              onChange={(e) => setHastaAdresi(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Adres"
            />

            <select
              value={hemsireId}
              onChange={(e) => setHemsireId(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            >
              <option value="">Hemşire seçiniz</option>
              {hemsireler.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.ad_soyad}
                </option>
              ))}
            </select>

            <textarea
              value={merkezNotu}
              onChange={(e) => setMerkezNotu(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Merkez notu"
            />

            <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-black">
              Adisyon Aç
            </button>
          </form>
        </section>

        <section className="lg:col-span-2 bg-white rounded-3xl shadow p-6">
          <h2 className="text-xl font-black mb-4">Hasta Adisyonları</h2>

          <div className="space-y-4">
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
                      <p className="text-sm font-bold mt-1">
                        Hemşire: {a.hemsire?.ad_soyad || "Atanmadı"}
                      </p>
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
                    onClick={() => setSeciliAdisyon(a)}
                    className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-black"
                  >
                    Detay / Hizmet / Ödeme
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-3 bg-white rounded-3xl shadow p-6">
          <h2 className="text-xl font-black mb-4">Geropital Hizmet Yönetimi</h2>

          <form onSubmit={hizmetKatalogunaEkle} className="grid md:grid-cols-5 gap-3 mb-5">
            <input
              value={yeniHizmetAdi}
              onChange={(e) => setYeniHizmetAdi(e.target.value)}
              className="border rounded-xl px-4 py-3"
              placeholder="Hizmet adı"
            />

            <input
              value={yeniHizmetFiyat}
              onChange={(e) => setYeniHizmetFiyat(e.target.value)}
              className="border rounded-xl px-4 py-3"
              placeholder="Fiyat"
            />

            <input
              value={yeniHizmetKategori}
              onChange={(e) => setYeniHizmetKategori(e.target.value)}
              className="border rounded-xl px-4 py-3"
              placeholder="Kategori"
            />

            <input
              value={yeniHizmetAciklama}
              onChange={(e) => setYeniHizmetAciklama(e.target.value)}
              className="border rounded-xl px-4 py-3"
              placeholder="Açıklama"
            />

            <button className="bg-blue-600 text-white rounded-xl font-black">
              Hizmet Ekle
            </button>
          </form>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hizmetler.map((h) => (
              <div key={h.id} className="border rounded-2xl p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-black">{h.hizmet_adi}</h3>
                    <p className="text-sm text-slate-500">{h.kategori}</p>
                    <p className="text-sm text-slate-500">{h.aciklama}</p>
                  </div>

                  <p className="font-black">{Number(h.varsayilan_fiyat).toLocaleString("tr-TR")} TL</p>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => hizmetFiyatGuncelle(h)}
                    className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-bold"
                  >
                    Fiyat
                  </button>

                  <button
                    onClick={() => hizmetAktifPasifYap(h)}
                    className={`px-3 py-2 rounded-xl text-sm font-bold ${
                      h.aktif ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {h.aktif ? "Pasif Yap" : "Aktif Yap"}
                  </button>
                </div>
              </div>
            ))}
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
              </div>

              <button onClick={() => setSeciliAdisyon(null)} className="bg-slate-100 px-4 py-2 rounded-xl font-black">
                Kapat
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {(seciliAdisyon.hizmetler || []).map((h: any) => (
                <div key={h.id} className="border rounded-xl p-3 flex justify-between">
                  <div>
                    <p className="font-black">{h.hizmet_adi}</p>
                    <p className="text-sm text-slate-500">{h.hizmet_tipi} • {h.aciklama}</p>
                  </div>
                  <p className="font-black">
                    {(Number(h.adet) * Number(h.birim_fiyat)).toLocaleString("tr-TR")} TL
                  </p>
                </div>
              ))}
            </div>

            <section className="bg-slate-50 rounded-2xl p-4 mb-5">
              <h3 className="font-black mb-3">Merkez Hizmeti Ekle</h3>

              <div className="grid md:grid-cols-4 gap-3">
                <select
                  value={seciliHizmetId}
                  onChange={(e) => hizmetSec(e.target.value)}
                  className="border rounded-xl px-4 py-3 md:col-span-2"
                >
                  <option value="">Hizmet seçiniz</option>
                  {hizmetler.filter((h) => h.aktif).map((h) => (
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
                placeholder="Açıklama"
              />

              <button onClick={adisyonaHizmetEkle} className="mt-3 bg-slate-900 text-white px-5 py-3 rounded-xl font-black">
                Hizmeti Ekle
              </button>
            </section>

            <section className="flex flex-wrap gap-2">
              <select
                value={seciliAdisyon.odeme_durumu}
                onChange={(e) => odemeDurumuGuncelle(seciliAdisyon.id, e.target.value)}
                className="border rounded-xl px-4 py-3"
              >
                <option>Ödeme Bekliyor</option>
                <option>Nakit Alındı</option>
                <option>Kredi Kartı Alındı</option>
                <option>Havale / EFT Bekleniyor</option>
                <option>Kısmi Ödeme Alındı</option>
                <option>Tamamı Ödendi</option>
              </select>

              <button onClick={() => adisyonDurumuGuncelle(seciliAdisyon.id, "Açık")} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black">
                Açık Yap
              </button>

              <button onClick={() => adisyonDurumuGuncelle(seciliAdisyon.id, "Kapalı")} className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black">
                Kapat
              </button>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}