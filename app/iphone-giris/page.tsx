"use client";

import { useSearchParams } from "next/navigation";

export default function IphoneGiris() {
  const searchParams = useSearchParams();
  const hata = searchParams.get("hata");

  let hataMetni = "";
  if (hata === "1") {
    hataMetni = "Kullanıcı adı veya şifre hatalı.";
  } else if (hata === "rol") {
    hataMetni = "Kullanıcı rolü tanımsız.";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f7fb",
        fontFamily: "Arial, sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 24,
          marginTop: 40,
          border: "1px solid #dbe7f3",
        }}
      >
        <img
          src="/logo-geropital.png"
          alt="Geropital"
          style={{ height: 58, display: "block", margin: "0 auto 20px" }}
        />

        <h1 style={{ color: "#144a7b", textAlign: "center" }}>
          iPhone Uyumlu Giriş
        </h1>

        {hataMetni && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#dc2626",
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {hataMetni}
          </div>
        )}

        <form method="GET" action="/iphone-giris-kontrol">
          <input
            name="kullanici"
            placeholder="Kullanıcı adı"
            autoCapitalize="none"
            autoCorrect="off"
            style={{
              width: "100%",
              padding: 16,
              fontSize: 18,
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />

          <input
            name="sifre"
            type="password"
            placeholder="Şifre"
            style={{
              width: "100%",
              padding: 16,
              fontSize: 18,
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              marginBottom: 16,
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 16,
              fontSize: 18,
              borderRadius: 12,
              border: 0,
              background: "#144a7b",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </main>
  );
}