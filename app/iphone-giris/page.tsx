export default function IphoneGiris() {
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
            }}
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </main>
  );
}