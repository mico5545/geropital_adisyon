export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Geropital iPhone Giriş</title>
<style>
body{margin:0;background:#f3f7fb;font-family:Arial;padding:20px}
.kart{background:white;border-radius:20px;padding:24px;margin-top:40px;border:1px solid #dbe7f3}
img{height:58px;display:block;margin:0 auto 20px}
h1{text-align:center;color:#144a7b}
input,button{width:100%;box-sizing:border-box;padding:16px;font-size:18px;border-radius:12px;margin-bottom:12px}
input{border:1px solid #cbd5e1}
button{border:0;background:#144a7b;color:white;font-weight:bold}
</style>
</head>
<body>
<div class="kart">
<img src="/logo-geropital.png" />
<h1>Geropital iPhone Giriş</h1>

<form method="GET" action="/iphone-giris-kontrol">
<input name="kullanici" placeholder="Kullanıcı adı" autocomplete="off" />
<input name="sifre" type="password" placeholder="Şifre" />
<button type="submit">Giriş Yap</button>
</form>
</div>
</body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
