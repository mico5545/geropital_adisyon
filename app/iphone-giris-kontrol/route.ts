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
    const yonlendirilecekUrl = `/hemsire-paneli-hafif?kullaniciId=${aktifKullanici.id}`;
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Yükleniyor...</title>
        <meta http-equiv="refresh" content="2;url=${yonlendirilecekUrl}">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            min-height: 100vh;
            background: linear-gradient(135deg, #f3f7fb 0%, #e8f1fb 100%);
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            text-align: center;
          }
          img {
            height: 80px;
            margin-bottom: 30px;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          h2 {
            color: #144a7b;
            font-size: 24px;
            margin: 0;
            font-weight: bold;
          }
          p {
            color: #64748b;
            margin-top: 12px;
            font-size: 14px;
          }
          .dots {
            margin-top: 30px;
            display: flex;
            justify-content: center;
            gap: 8px;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #144a7b;
            animation: bounce 1.4s infinite;
          }
          .dot:nth-child(1) { animation-delay: 0s; }
          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="/logo-geropital.png" alt="Geropital">
          <h2>Geropital Yükleniyor</h2>
          <p>Lütfen bekleyin...</p>
          <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (aktifKullanici.rol === "merkez") {
    return NextResponse.redirect(new URL("/merkez-paneli", request.url));
  }

  return NextResponse.redirect(new URL("/iphone-giris", request.url));
}
