"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/kutuphane/supabase";
import KurumsalHeader from "@/bilesenler/KurumsalHeader";

type Bildirim = {
  id: string;
  hasta_kaydi_id: string;
  baslik: string;
  mesaj: string | null;
  okundu: boolean;
  olusturma_tarihi: string;
};

export default function BildirimlerSayfasi() {
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  function cikisYap() {
    localStorage.removeItem("kullanici");
    window.location.href = "/giris";
  }

  useEffect(() => {
    bildirimleriGetir();
  }, []);

  async function bildirimleriGetir() {
    setYukleniyor(true);

    const { data, error } = await supabase
      .from("bildirimler")
      .select("*")
      .order("olusturma_tarihi", { ascending: false });

    if (error) {
      console.log("Bildirimler çekilemedi:", error);
      alert("Bildirimler çekilemedi.");
      setYukleniyor(false);
      return;
    }

    setBildirimler((data as Bildirim[]) || []);
    setYukleniyor(false);
  }

  async function okunduYap(id: string) {
    await supabase.from("bildirimler").update({ okundu: true }).eq("id", id);
    await bildirimleriGetir();
  }

  async function hepsiniOkunduYap() {
    await supabase.from("bildirimler").update({ okundu: true }).eq("okundu", false);
    await bildirimleriGetir();
  }

  function tarihFormatla(tarih: string) {
    return new Date(tarih).toLocaleString("tr-TR");
  }

  return (
    <main className="min-h-screen kurumsal-arka-plan">
      <section className="border-b border-[#144a7b]/10 py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-5">
          <h1 className="text-3xl lg:text-4xl font-black text-[#144a7b] mb-2">Bildirimler</h1>
          <p className="text-sm text-slate-600">Sistem bildirimleri ve merkez onayı bekleyen işlemler</p>
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
      <div className="max-w-7xl mx-auto p-5">

        <section className="space-y-3">
          {bildirimler.length === 0 && (
            <div className="bg-white rounded-3xl shadow p-6 text-slate-500">
              Bildirim bulunmuyor.
            </div>
          )}

          {bildirimler.map((bildirim) => (
            <div
              key={bildirim.id}
              className={`rounded-3xl shadow p-5 border ${
                bildirim.okundu
                  ? "bg-white border-slate-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {bildirim.baslik}
                  </h2>

                  <p className="text-slate-700 mt-1">{bildirim.mesaj}</p>

                  <p className="text-xs text-slate-500 mt-3">
                    {tarihFormatla(bildirim.olusturma_tarihi)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!bildirim.okundu && (
                    <button
                      onClick={() => okunduYap(bildirim.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"
                    >
                      Okundu Yap
                    </button>
                  )}

                  <a
                    href="/merkez-paneli"
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold"
                  >
                    Kayda Git
                  </a>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}