"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/kutuphane/supabase";
import KurumsalHeader from "@/bilesenler/KurumsalHeader";
import Yukleniyor from "@/bilesenler/Yukleniyor";

type Bildirim = {
  id: string;
  hasta_kaydi_id: string;
  baslik: string;
  mesaj: string | null;
  okundu: boolean;
  olusturma_tarihi: string;
  tip?: "odeme" | "ek_hizmet" | "onay" | "yeni_kayit" | string;
};

export default function BildirimlerSayfasi() {
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  function bildirimRenk(tip?: string) {
    if (tip === "odeme") return "bg-emerald-50 border-emerald-200";
    if (tip === "ek_hizmet") return "bg-amber-50 border-amber-200";
    if (tip === "onay") return "bg-blue-50 border-blue-200";
    if (tip === "yeni_kayit") return "bg-purple-50 border-purple-200";
    return "bg-slate-50 border-slate-200";
  }

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
    
    setTimeout(() => {
      setYukleniyor(false);
    }, 800);
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

  if (yukleniyor) {
    return <Yukleniyor />;
  }

  return (
    <>
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
          { href: "/kapatilan-hasta-kayitlari", label: "Arşiv" },
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

        <section className="space-y-2 sm:space-y-3">
          {bildirimler.length === 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow p-4 sm:p-6 text-slate-500 text-sm">
              Bildirim bulunmuyor.
            </div>
          )}

          {bildirimler.map((bildirim) => (
            <div
              key={bildirim.id}
              className={`rounded-2xl sm:rounded-3xl shadow p-4 sm:p-5 border text-sm sm:text-base ${
                bildirim.okundu
                  ? "bg-white border-slate-200"
                  : bildirimRenk(bildirim.tip)
              }`}
            >
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900">
                    {bildirim.baslik}
                  </h2>

                  <p className="text-slate-700 mt-1 text-sm">{bildirim.mesaj}</p>

                  <p className="text-xs text-slate-500 mt-2">
                    {tarihFormatla(bildirim.olusturma_tarihi)}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!bildirim.okundu && (
                    <button
                      onClick={() => okunduYap(bildirim.id)}
                      className="bg-blue-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex-1 sm:flex-initial"
                    >
                      Okundu Yap
                    </button>
                  )}

                  <a
                    href={`/merkez-paneli?kayit=${bildirim.hasta_kaydi_id}`}
                    className="bg-slate-900 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex-1 sm:flex-initial text-center"
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
    </>
  );
}