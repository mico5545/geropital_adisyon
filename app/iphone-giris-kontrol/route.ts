import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bagdpvuujltcysniukry.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET(request: NextRequest) {
  const kullanici = request.nextUrl.searchParams.get("kullanici") || "";
  const sifre = request.nextUrl.searchParams.get("sifre") || "";

  const url =
    `${SUPABASE_URL}/rest/v1/kullanicilar?select=*&kullanici_adi=eq.${encodeURIComponent(kullanici.trim())}&sifre=eq.${encodeURIComponent(sifre.trim())}&aktif=eq.true`;

  const cevap = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  });

  const data = await cevap.json();

  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.redirect(new URL("/iphone-giris", request.url));
  }

  const aktifKullanici = data[0];

  if (aktifKullanici.rol === "hemsire") {
    return NextResponse.redirect(
      new URL(`/hemsire-paneli-hafif?kullaniciId=${aktifKullanici.id}`, request.url)
    );
  }

  if (aktifKullanici.rol === "merkez") {
    return NextResponse.redirect(new URL("/merkez-paneli", request.url));
  }

  return NextResponse.redirect(new URL("/iphone-giris", request.url));
}
