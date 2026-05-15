export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Hemşire Özel Giriş</title>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: linear-gradient(135deg, #f3f7fb 0%, #e8f1fb 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.container {
  width: 100%;
  max-width: 420px;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  height: 64px;
  width: auto;
  display: inline-block;
  margin-bottom: 16px;
}

.kart {
  background: white;
  border-radius: 24px;
  padding: 32px 24px;
  box-shadow: 0 4px 20px rgba(20, 74, 123, 0.08);
  border: 1px solid rgba(20, 74, 123, 0.1);
}

h1 {
  color: #144a7b;
  font-size: 28px;
  font-weight: 900;
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 32px;
  text-align: center;
}

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      color: #334155;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
    }

input {
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-family: inherit;
}

input:focus {
  outline: none;
  border-color: #144a7b;
  box-shadow: 0 0 0 3px rgba(20, 74, 123, 0.1);
  background-color: #f8fafc;
}

input::placeholder {
  color: #94a3b8;
}

button {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 900;
  border: none;
  border-radius: 12px;
  background: #144a7b;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

button:hover {
  background: #0f3a5f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(20, 74, 123, 0.2);
}

button:active {
  transform: translateY(0);
}

@media (max-width: 480px) {
  .kart {
    padding: 24px 16px;
  }

  h1 {
    font-size: 24px;
  }

  input {
    padding: 12px 14px;
    font-size: 16px;
  }

  button {
    padding: 12px 14px;
  }
}
</style>
</head>
<body>
<div class="container">
  <div class="logo-section">
    <img src="/logo-geropital.png" alt="Geropital" class="logo" />
  </div>

  <div class="kart">
    <h1>Hemşire Özel Giriş</h1>
    <p class="subtitle">Hemşire paneline erişim</p>

    <form method="GET" action="/iphone-giris-kontrol">
      <div class="form-group">
        <label for="kullanici">Kullanıcı Adı</label>
        <input 
          id="kullanici"
          name="kullanici" 
          placeholder="Kullanıcı adınızı giriniz" 
          autocomplete="off"
          required
        />
      </div>

      <div class="form-group">
        <label for="sifre">Şifre</label>
        <input 
          id="sifre"
          name="sifre" 
          type="password" 
          placeholder="Şifrenizi giriniz"
          required
        />
      </div>

      <button type="submit">Giriş Yap</button>
    </form>
  </div>
</div>
</body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
