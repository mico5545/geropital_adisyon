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
  text-align: center;
}

h1 {
  color: #144a7b;
  font-size: 28px;
  font-weight: 900;
  margin-bottom: 8px;
}

.subtitle {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 32px;
}

.button-container {
  margin-top: 24px;
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

.loading {
  display: none;
  text-align: center;
  margin-top: 16px;
}

.spinner {
  border: 4px solid rgba(20, 74, 123, 0.1);
  border-top: 4px solid #144a7b;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.info-box {
  margin-top: 24px;
  padding: 16px;
  background: #f0f9ff;
  border-left: 4px solid #0284c7;
  border-radius: 8px;
  font-size: 13px;
  color: #0c4a6e;
  line-height: 1.6;
}

.info-box strong {
  display: block;
  margin-bottom: 4px;
  color: #0369a1;
}

@media (max-width: 480px) {
  .kart {
    padding: 24px 16px;
  }

  h1 {
    font-size: 24px;
  }

  button {
    padding: 14px;
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

    <div class="button-container">
      <button onclick="girisYap()">Giriş Yap</button>
      <div class="loading" id="loading">
        <div class="spinner"></div>
        <p style="margin-top: 12px; color: #144a7b; font-weight: bold;">Giriş yapılıyor...</p>
      </div>
    </div>

    <div class="info-box">
      <strong>Hemşire Paneline Hoş Geldiniz</strong>
      Giriş yapmak için butona basınız
    </div>
  </div>
</div>

<script>
function girisYap() {
  const button = event.target;
  const loading = document.getElementById('loading');
  
  button.disabled = true;
  button.style.opacity = '0.6';
  loading.style.display = 'block';
  
  // Form submit et
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = '/iphone-giris-kontrol';
  
  const kullaniciInput = document.createElement('input');
  kullaniciInput.type = 'hidden';
  kullaniciInput.name = 'kullanici';
  kullaniciInput.value = 'hemsire';
  
  const sifreInput = document.createElement('input');
  sifreInput.type = 'hidden';
  sifreInput.name = 'sifre';
  sifreInput.value = '1234';
  
  form.appendChild(kullaniciInput);
  form.appendChild(sifreInput);
  document.body.appendChild(form);
  form.submit();
}
</script>
</body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
