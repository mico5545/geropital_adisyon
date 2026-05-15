"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/kutuphane/supabase";
import KurumsalHeader from "@/bilesenler/KurumsalHeader";
import Yukleniyor from "@/bilesenler/Yukleniyor";

type Hizmet = {
  id: string;
  hizmet_adi: string;
  fiyat: number;
  kategori: string | null;
  aciklama: string | null;
  aktif: boolean;
};

export default function HizmetYonetimi() {
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [hizmetAdi, setHizmetAdi] = useState("");
  const [fiyat, setFiyat] = useState("");
  const [kategori, setKategori] = useState("");
  const [aciklama, setAciklama] = useState("");

  const [duzenlenen, setDuzenlenen] = useState<Hizmet | null>(null);

  // Arama ve filtreleme
  const [aramaMetni, setAramaMetni] = useState("");
  const [secilenKategori, setSecilenKategori] = useState<string | null>(null);
  const [secilenDurum, setSecilenDurum] = useState<"hepsi" | "aktif" | "pasif">("hepsi");

  // Modal ve kategori yönetimi
  const [modalAcikHizmetEkle, setModalAcikHizmetEkle] = useState(false);
  const [yeniKategoriAdi, setYeniKategoriAdi] = useState("");
  const [kategorilerList, setKategorilerList] = useState([
    "Hemşire Bakımı",
    "Fizyoterapist/Masaj",
    "Tıbbi Malzeme / Sarf Malzeme",
    "Laboratuvar Hizmetleri",
    "Doktor Ziyareti",
    "İlaç Yönetimi",
    "Yaşlı Bakımı - Kişisel Hijyen",
    "Yaşlı Bakımı - Mobilizasyon",
    "Beslenme Danışmanlığı",
    "Psikolojik Destek / Danışmanlık",
    "Ev Temizliği / Sanitasyon",
    "Ulaşım / Nakil Hizmetleri",
    "Diyaliz / İnfüzyon Hizmetleri",
    "Odyoloji / İşitme Testi",
    "Diğer",
  ]);

  function cikisYap() {
    localStorage.removeItem("kullanici");
    window.location.href = "/giris";
  }

  useEffect(() => {
    hizmetleriGetir();
  }, []);

  async function hizmetleriGetir() {
    setYukleniyor(true);

    const { data, error } = await supabase
      .from("hizmet_katalogu")
      .select("*")
      .order("hizmet_adi", { ascending: true });

    if (error) {
      console.log(error);
      alert("Hizmetler getirilemedi.");
      setYukleniyor(false);
      return;
    }

    setHizmetler((data as Hizmet[]) || []);
    
    setTimeout(() => {
      setYukleniyor(false);
    }, 800);
  }

  async function hizmetEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hizmetAdi.trim()) {
      alert("Hizmet adı zorunludur.");
      return;
    }

    if (!fiyat.trim()) {
      alert("Fiyat zorunludur.");
      return;
    }

    if (!kategori.trim()) {
      alert("Kategori zorunludur.");
      return;
    }

    const { error } = await supabase.from("hizmet_katalogu").insert({
      hizmet_adi: hizmetAdi,
      fiyat: Number(fiyat || 0),
      kategori,
      aciklama,
      aktif: true,
    });

    if (error) {
      console.log(error);
      alert("Hizmet eklenemedi.");
      return;
    }

    setHizmetAdi("");
    setFiyat("");
    setKategori("");
    setAciklama("");
    setModalAcikHizmetEkle(false);

    await hizmetleriGetir();
  }

  function kategoriEkle() {
    const trimmedKategori = yeniKategoriAdi.trim();

    if (!trimmedKategori) {
      alert("Kategori adı boş olamaz.");
      return;
    }

    if (kategorilerList.includes(trimmedKategori)) {
      alert("Bu kategori zaten mevcut.");
      return;
    }

    setKategorilerList([...kategorilerList, trimmedKategori]);
    setYeniKategoriAdi("");
    alert("Kategori başarıyla eklendi.");
  }

  async function hizmetGuncelle() {
    if (!duzenlenen) return;

    const { error } = await supabase
      .from("hizmet_katalogu")
      .update({
        hizmet_adi: duzenlenen.hizmet_adi,
        fiyat: Number(duzenlenen.fiyat || 0),
        kategori: duzenlenen.kategori,
        aciklama: duzenlenen.aciklama,
        aktif: duzenlenen.aktif,
      })
      .eq("id", duzenlenen.id);

    if (error) {
      console.log(error);
      alert("Hizmet güncellenemedi.");
      return;
    }

    setDuzenlenen(null);
    await hizmetleriGetir();
  }

  async function aktifPasifYap(hizmet: Hizmet) {
    const { error } = await supabase
      .from("hizmet_katalogu")
      .update({ aktif: !hizmet.aktif })
      .eq("id", hizmet.id);

    if (error) {
      console.log(error);
      alert("İşlem yapılamadı.");
      return;
    }

    await hizmetleriGetir();
  }

  function filtreliHizmetleriGetir() {
    return hizmetler.filter((hizmet) => {
      // Arama metnine göre filtrele
      const aramaUyuyor = hizmet.hizmet_adi
        .toLowerCase()
        .includes(aramaMetni.toLowerCase());

      // Kategoriye göre filtrele
      const kategoriUyuyor =
        secilenKategori === null ||
        secilenKategori === "" ||
        hizmet.kategori === secilenKategori;

      // Duruma göre filtrele
      const durumUyuyor =
        secilenDurum === "hepsi" ||
        (secilenDurum === "aktif" && hizmet.aktif) ||
        (secilenDurum === "pasif" && !hizmet.aktif);

      return aramaUyuyor && kategoriUyuyor && durumUyuyor;
    });
  }

  function kategorileriGetir() {
    const kategoriler = new Set<string>(kategorilerList);
    hizmetler.forEach((h) => {
      if (h.kategori) kategoriler.add(h.kategori);
    });
    return Array.from(kategoriler).sort();
  }

  if (yukleniyor) {
    return <Yukleniyor />;
  }

  return (
    <main className="min-h-screen kurumsal-arka-plan">
      <section className="border-b border-[#144a7b]/10 py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-5">
          <h1 className="text-3xl lg:text-4xl font-black text-[#144a7b] mb-2">Hizmet Yönetimi</h1>
          <p className="text-sm text-slate-600">Hizmet katalogu, fiyat ve aktif/pasif durumları</p>
        </div>
      </section>

      <KurumsalHeader
        linkler={[
          { href: "/merkez-paneli", label: "Merkez Paneli" },
          { href: "/gunluk-saha-plani", label: "Günlük Saha Planı" },
          { href: "/hizmet-yonetimi", label: "Hizmet Yönetimi" },
          { href: "/bildirimler", label: "Bildirimler" },
          { href: "/kapatilan-hasta-kayitlari", label: "Kapatılan Kayıtlar" },
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
      <div className="max-w-7xl mx-auto p-3 sm:p-5">

        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => setModalAcikHizmetEkle(true)}
            className="bg-[#144a7b] text-white px-6 py-3 rounded-xl font-black hover:bg-[#0f3a5f] transition"
          >
            + Yeni Hizmet Ekle
          </button>
        </div>

        <section className="kurumsal-kart rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">🔍 Arama ve Filtreleme</h2>

          <div className="grid sm:grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Hizmet Ara
              </label>
              <input
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                type="text"
                placeholder="Hizmet adı ile ara..."
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Kategori
              </label>
              <select
                value={secilenKategori || ""}
                onChange={(e) =>
                  setSecilenKategori(e.target.value === "" ? null : e.target.value)
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                <option value="">Tüm Kategoriler</option>
                {kategorileriGetir().map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Durum
              </label>
              <select
                value={secilenDurum}
                onChange={(e) =>
                  setSecilenDurum(e.target.value as "hepsi" | "aktif" | "pasif")
                }
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              >
                <option value="hepsi">Tüm Hizmetler</option>
                <option value="aktif">Sadece Aktif</option>
                <option value="pasif">Sadece Pasif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Sonuç
              </label>
              <div className="bg-slate-100 rounded-xl px-4 py-3 font-bold text-slate-900">
                {filtreliHizmetleriGetir().length} / {hizmetler.length}
              </div>
            </div>
          </div>
        </section>

        <section className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtreliHizmetleriGetir().length === 0 ? (
            <div className="col-span-full kurumsal-kart rounded-2xl sm:rounded-3xl p-6 text-center">
              <p className="text-slate-600 font-bold">
                {hizmetler.length === 0
                  ? "Hizmet bulunmuyor."
                  : "Arama kriterlerine uygun hizmet bulunamadı."}
              </p>
            </div>
          ) : (
            filtreliHizmetleriGetir().map((hizmet) => (
              <div key={hizmet.id} className="kurumsal-kart rounded-2xl sm:rounded-3xl p-4 sm:p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {hizmet.hizmet_adi}
                    </h3>
                    <p className="text-sm text-slate-500">{hizmet.kategori}</p>
                    <p className="text-sm text-slate-500 mt-1">{hizmet.aciklama}</p>
                  </div>

                  <p className="font-black text-[#144a7b]">
                    {Number(hizmet.fiyat).toLocaleString("tr-TR")} TL
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => setDuzenlenen(hizmet)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold"
                  >
                    Düzenle
                  </button>

                  <button
                    onClick={() => aktifPasifYap(hizmet)}
                    className={`px-4 py-2 rounded-xl font-bold ${
                      hizmet.aktif
                        ? "bg-red-50 text-red-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {hizmet.aktif ? "Pasif Yap" : "Aktif Yap"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {duzenlenen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between gap-4 mb-6">
              <h2 className="text-2xl font-black text-[#144a7b]">Hizmet Düzenle</h2>
              <button
                onClick={() => setDuzenlenen(null)}
                className="bg-slate-100 px-4 py-2 rounded-xl font-black hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Hizmet Adı *
                </label>
                <input
                  value={duzenlenen.hizmet_adi}
                  onChange={(e) =>
                    setDuzenlenen({ ...duzenlenen, hizmet_adi: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                  placeholder="Hizmet adını giriniz..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fiyat (TL) *
                </label>
                <input
                  value={duzenlenen.fiyat}
                  onChange={(e) =>
                    setDuzenlenen({ ...duzenlenen, fiyat: Number(e.target.value) })
                  }
                  type="number"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                  placeholder="Fiyat giriniz..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Kategori * (Seç)
                </label>
                <select
                  value={duzenlenen.kategori || ""}
                  onChange={(e) =>
                    setDuzenlenen({ ...duzenlenen, kategori: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                >
                  <option value="">Kategori seçiniz</option>
                  {kategorilerList.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Açıklama (İsteğe Bağlı)
                </label>
                <textarea
                  value={duzenlenen.aciklama || ""}
                  onChange={(e) =>
                    setDuzenlenen({ ...duzenlenen, aciklama: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 min-h-24"
                  placeholder="Hizmet açıklaması..."
                />
              </div>

              <button
                onClick={hizmetGuncelle}
                className="w-full bg-[#144a7b] text-white rounded-xl py-3 font-black hover:bg-[#0f3a5f] transition"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAcikHizmetEkle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between gap-4 mb-6">
              <h2 className="text-2xl font-black text-[#144a7b]">Yeni Hizmet Ekle</h2>
              <button
                onClick={() => setModalAcikHizmetEkle(false)}
                className="bg-slate-100 px-4 py-2 rounded-xl font-black hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-lg mb-6">
              <h3 className="font-black text-emerald-900 mb-3">📌 Yeni Kategori Ekle</h3>
              <p className="text-xs text-emerald-800 mb-3">Seçili kategoride yoksa buradan ekle</p>
              <div className="flex gap-2">
                <input
                  value={yeniKategoriAdi}
                  onChange={(e) => setYeniKategoriAdi(e.target.value)}
                  placeholder="Kategori adını giriniz..."
                  className="flex-1 border border-emerald-300 rounded-xl px-4 py-3 text-slate-900"
                  onKeyPress={(e) => e.key === "Enter" && kategoriEkle()}
                />
                <button
                  onClick={kategoriEkle}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black hover:bg-emerald-700 transition whitespace-nowrap"
                >
                  + Ekle
                </button>
              </div>
            </div>

            <hr className="my-6" />
            <h3 className="text-lg font-black text-slate-900 mb-4">Hizmet Bilgileri</h3>

            <form onSubmit={hizmetEkle} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Hizmet Adı *
                </label>
                <input
                  value={hizmetAdi}
                  onChange={(e) => setHizmetAdi(e.target.value)}
                  placeholder="Hizmet adını giriniz..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fiyat (TL) *
                </label>
                <input
                  value={fiyat}
                  onChange={(e) => setFiyat(e.target.value)}
                  type="number"
                  placeholder="Fiyat giriniz..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Kategori * (Seç)
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                >
                  <option value="">Kategori seçiniz</option>
                  {kategorilerList.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Açıklama (İsteğe Bağlı)
                </label>
                <textarea
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder="Hizmet açıklaması..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 min-h-24"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#144a7b] text-white rounded-xl py-3 font-black hover:bg-[#0f3a5f] transition"
                >
                  Hizmet Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setModalAcikHizmetEkle(false)}
                  className="flex-1 bg-slate-200 text-slate-900 rounded-xl py-3 font-black hover:bg-slate-300 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}