"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/kutuphane/supabase";
import KurumsalHeader from "@/bilesenler/KurumsalHeader";

type Kullanici = {
  id: string;
  ad_soyad: string;
  rol: string;
  aktif: boolean;
};

type Hizmet = {
  id: string;
  hizmet_adi: string;
  fiyat: number;
  aktif: boolean;
};

type Kayit = {
  id: string;
  durum: string;
  odeme_durumu: string;
  plan_tarihi: string | null;
  plan_saati: string | null;
  plan_notu: string | null;
  olusturma_tarihi: string;
  hastalar: {
    hasta_adi: string;
    telefon: string | null;
    adres: string | null;
  }[] | null;
  hasta_hizmetleri: {
    id: string;
    hizmet_adi: string;
    adet: number;
    birim_fiyat: number;
  }[];
};

const saatler = Array.from({ length: 31 }, (_, i) => {
  const toplamDakika = 7 * 60 + i * 30;
  const saat = Math.floor(toplamDakika / 60);
  const dakika = toplamDakika % 60;
  return `${String(saat).padStart(2, "0")}:${String(dakika).padStart(2, "0")}`;
});

export default function GunlukSahaPlani() {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [gorunum, setGorunum] = useState<"takvim" | "liste">("takvim");

  const [kayitlar, setKayitlar] = useState<Kayit[]>([]);
  const [hemsireler, setHemsireler] = useState<Kullanici[]>([]);
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);

  const [hastaAdi, setHastaAdi] = useState("");
  const [telefon, setTelefon] = useState("");
  const [adres, setAdres] = useState("");
  const [hemsireId, setHemsireId] = useState("");
  const [planSaati, setPlanSaati] = useState("");
  const [planNotu, setPlanNotu] = useState("");
  const [hizmetId, setHizmetId] = useState("");

  const [arama, setArama] = useState("");
  const [durumFiltre, setDurumFiltre] = useState("");
  const [siralama, setSiralama] = useState("saat");

  function cikisYap() {
    localStorage.removeItem("kullanici");
    window.location.href = "/giris";
  }

  useEffect(() => {
    verileriGetir();
  }, [tarih]);

  async function verileriGetir() {
    const { data: kayitData } = await supabase
      .from("hasta_kayitlari")
      .select(`
        id,
        durum,
        odeme_durumu,
        plan_tarihi,
        plan_saati,
        plan_notu,
        olusturma_tarihi,
        hastalar (
          hasta_adi,
          telefon,
          adres
        ),
        hasta_hizmetleri (
          id,
          hizmet_adi,
          adet,
          birim_fiyat
        )
      `)
      .eq("plan_tarihi", tarih)
      .neq("durum", "Kapalı")
      .order("plan_saati", { ascending: true });

    const { data: hemsireData } = await supabase
      .from("kullanicilar")
      .select("id, ad_soyad, rol, aktif")
      .eq("rol", "hemsire")
      .eq("aktif", true)
      .order("ad_soyad");

    const { data: hizmetData } = await supabase
      .from("hizmet_katalogu")
      .select("id, hizmet_adi, fiyat, aktif")
      .eq("aktif", true)
      .order("hizmet_adi");

    setKayitlar((kayitData as Kayit[]) || []);
    setHemsireler((hemsireData as Kullanici[]) || []);
    setHizmetler((hizmetData as Hizmet[]) || []);
    setYukleniyor(false);
  }

  function toplamHesapla(kayit: Kayit) {
    return (kayit.hasta_hizmetleri || []).reduce((toplam, hizmet) => {
      return toplam + Number(hizmet.adet) * Number(hizmet.birim_fiyat);
    }, 0);
  }

  const filtreliKayitlar = useMemo(() => {
    let liste = [...kayitlar];

    if (arama.trim()) {
      liste = liste.filter((k) =>
        `${k.hastalar?.[0]?.hasta_adi || ""} ${k.hastalar?.[0]?.telefon || ""} ${k.hastalar?.[0]?.adres || ""}`
          .toLowerCase()
          .includes(arama.toLowerCase())
      );
    }

    if (durumFiltre) {
      liste = liste.filter((k) => k.durum === durumFiltre);
    }

    if (siralama === "fiyat-artan") {
      liste.sort((a, b) => toplamHesapla(a) - toplamHesapla(b));
    }

    if (siralama === "fiyat-azalan") {
      liste.sort((a, b) => toplamHesapla(b) - toplamHesapla(a));
    }

    if (siralama === "hasta") {
      liste.sort((a, b) =>
       hastaAdiGetir(a).localeCompare(hastaAdiGetir(b))
      );
    }

    if (siralama === "saat") {
      liste.sort((a, b) => String(a.plan_saati).localeCompare(String(b.plan_saati)));
    }

    return liste;
  }, [kayitlar, arama, durumFiltre, siralama]);

  async function kayitOlustur(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hastaAdi || !hemsireId || !planSaati) {
      alert("Hasta adı, hemşire ve saat zorunludur.");
      return;
    }

    const { data: hasta, error: hastaHata } = await supabase
      .from("hastalar")
      .insert({
        hasta_adi: hastaAdi,
        telefon,
        adres,
      })
      .select()
      .single();

    if (hastaHata || !hasta) {
      alert("Hasta oluşturulamadı.");
      return;
    }

    const { data: kayit, error: kayitHata } = await supabase
      .from("hasta_kayitlari")
      .insert({
        hasta_id: hasta.id,
        hemsire_id: hemsireId,
        durum: "Aktif",
        odeme_durumu: "Tamamı Alınmadı",
        plan_tarihi: tarih,
        plan_saati: planSaati,
        plan_notu: planNotu,
      })
      .select()
      .single();

    if (kayitHata || !kayit) {
      alert("Hasta kaydı oluşturulamadı.");
      return;
    }

    const hizmet = hizmetler.find((h) => h.id === hizmetId);

    if (hizmet) {
      await supabase.from("hasta_hizmetleri").insert({
        hasta_kaydi_id: kayit.id,
        hizmet_adi: hizmet.hizmet_adi,
        hizmet_tipi: "Merkez Plan Hizmeti",
        adet: 1,
        birim_fiyat: hizmet.fiyat,
        aciklama: "Günlük saha planından eklendi.",
      });
    }

    setHastaAdi("");
    setTelefon("");
    setAdres("");
    setHemsireId("");
    setPlanSaati("");
    setPlanNotu("");
    setHizmetId("");

    await verileriGetir();
  }

  return (
    <main className="min-h-screen kurumsal-arka-plan">
      <section className="border-b border-[#144a7b]/10 py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-5">
          <h1 className="text-3xl lg:text-4xl font-black text-[#144a7b] mb-2">Günlük Saha Planı</h1>
          <p className="text-sm text-slate-600">Hemşirelerin günlük ziyaret takvimi ve saha işlemleri</p>
        </div>
      </section>

      <KurumsalHeader
        linkler={[
          { href: "/merkez-paneli", label: "Merkez Paneli" },
          { href: "/gunluk-saha-plani", label: "G\u00fcnl\u00fck Saha Plan\u0131" },
          { href: "/hizmet-yonetimi", label: "Hizmet Y\u00f6netimi" },
          { href: "/bildirimler", label: "Bildirimler" },
          { href: "/kapatilan-hasta-kayitlari", label: "Kaapat\u0131lan Kay\u0131tlar" },
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

      <div className="max-w-7xl mx-auto p-5">
        <section className="grid lg:grid-cols-3 gap-6">
          <form onSubmit={kayitOlustur} className="kurumsal-kart rounded-3xl p-6 h-fit space-y-3">
            <h2 className="text-xl font-black text-slate-900">Planlı Hasta Kaydı Aç</h2>

            <input
              value={hastaAdi}
              onChange={(e) => setHastaAdi(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3"
              placeholder="Hasta adı soyadı"
            />

            <input
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3"
              placeholder="Telefon"
            />

            <textarea
              value={adres}
              onChange={(e) => setAdres(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-20"
              placeholder="Adres"
            />

            <select
              value={hemsireId}
              onChange={(e) => setHemsireId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3"
            >
              <option value="">Hemşire seçiniz</option>
              {hemsireler.map((h) => (
                <option key={h.id} value={h.id}>{h.ad_soyad}</option>
              ))}
            </select>

            <select
              value={planSaati}
              onChange={(e) => setPlanSaati(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3"
            >
              <option value="">Saat seçiniz</option>
              {saatler.map((saat) => (
                <option key={saat} value={saat}>{saat}</option>
              ))}
            </select>

            <select
              value={hizmetId}
              onChange={(e) => setHizmetId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3"
            >
              <option value="">Hizmet seçiniz</option>
              {hizmetler.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hizmet_adi} - {Number(h.fiyat).toLocaleString("tr-TR")} TL
                </option>
              ))}
            </select>

            <textarea
              value={planNotu}
              onChange={(e) => setPlanNotu(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-20"
              placeholder="Plan notu"
            />

            <button className="w-full bg-[#144a7b] text-white rounded-xl py-3 font-black">
              Planlı Kaydı Oluştur
            </button>
          </form>

          <section className="lg:col-span-2 kurumsal-kart rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">Günlük Görünüm</h2>
                <p className="text-sm text-slate-500">Takvim veya liste görünümü.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="border border-slate-300 rounded-xl px-4 py-2"
                />

                <button
                  onClick={() => setGorunum("takvim")}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    gorunum === "takvim" ? "bg-[#144a7b] text-white" : "bg-slate-100"
                  }`}
                >
                  Takvim
                </button>

                <button
                  onClick={() => setGorunum("liste")}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    gorunum === "liste" ? "bg-[#144a7b] text-white" : "bg-slate-100"
                  }`}
                >
                  Liste
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-3 mb-5">
              <input
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2"
                placeholder="Hasta / telefon / adres ara"
              />

              <select
                value={durumFiltre}
                onChange={(e) => setDurumFiltre(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2"
              >
                <option value="">Tüm durumlar</option>
                <option>Aktif</option>
                <option>Merkez Onayı Bekliyor</option>
              </select>

              <select
                value={siralama}
                onChange={(e) => setSiralama(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2"
              >
                <option value="saat">Saate göre</option>
                <option value="hasta">Hasta adına göre</option>
                <option value="fiyat-artan">Fiyat artan</option>
                <option value="fiyat-azalan">Fiyat azalan</option>
              </select>
            </div>

            {gorunum === "takvim" && (
              <div className="space-y-2">
                {saatler.map((saat) => {
                  const saatKayitlari = filtreliKayitlar.filter((k) =>
                    String(k.plan_saati || "").startsWith(saat)
                  );

                  return (
                    <div key={saat} className="grid grid-cols-[80px_1fr] gap-3">
                      <div className="bg-[#144a7b] text-white rounded-xl p-3 font-black text-center">
                        {saat}
                      </div>

                      <div className="bg-white/80 border border-slate-200 rounded-xl p-3 min-h-16">
                        {saatKayitlari.length === 0 ? (
                          <p className="text-sm text-slate-400">Boş</p>
                        ) : (
                          <div className="space-y-2">
                            {saatKayitlari.map((k) => (
                              <div key={k.id} className="bg-slate-50 rounded-xl p-3">
                                <p className="font-black text-slate-900">
                                  {k.hastalar?.[0]?.hasta_adi}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {k.hastalar?.[0]?.adres}
                                </p>
                                <p className="text-sm font-bold text-[#144a7b]">
                                  {toplamHesapla(k).toLocaleString("tr-TR")} TL • {k.odeme_durumu}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {gorunum === "liste" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="p-3">Saat</th>
                      <th className="p-3">Hasta</th>
                      <th className="p-3">Adres</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3">Ödeme</th>
                      <th className="p-3 text-right">Tutar</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtreliKayitlar.map((k) => (
                      <tr key={k.id} className="border-b border-slate-200">
                        <td className="p-3 font-bold">{String(k.plan_saati).slice(0, 5)}</td>
                        <td className="p-3">{k.hastalar?.[0]?.hasta_adi}</td>
                        <td className="p-3">{k.hastalar?.[0]?.adres}</td>
                        <td className="p-3">{k.durum}</td>
                        <td className="p-3">{k.odeme_durumu}</td>
                        <td className="p-3 text-right font-black">
                          {toplamHesapla(k).toLocaleString("tr-TR")} TL
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
