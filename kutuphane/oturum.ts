export function kullaniciKaydet(kullanici: unknown) {
  const veri = JSON.stringify(kullanici);

  console.log("📝 localStorage'a Kullanıcı Yazılıyor...");
  localStorage.setItem("kullanici", veri);
  console.log("✅ localStorage'a Başarıyla Yazıldı");

  console.log("🍪 Cookie'ye Kullanıcı Yazılıyor...");
  document.cookie =
    "kullanici=" +
    encodeURIComponent(veri) +
    "; path=/; max-age=604800; SameSite=Lax";
  console.log("✅ Cookie'ye Başarıyla Yazıldı");
}

export function kullaniciOku() {
  console.log("📖 localStorage'dan Kullanıcı Okunuyor...");
  const localVeri = localStorage.getItem("kullanici");

  if (localVeri) {
    console.log("✅ localStorage'dan Okundu");
    return JSON.parse(localVeri);
  }

  console.log("⚠️ localStorage Boş, Cookie'den Okunuyor...");
  const cookieVeri = document.cookie
    .split("; ")
    .find((satir) => satir.startsWith("kullanici="));

  if (!cookieVeri) {
    console.log("❌ Cookie'de de Kullanıcı Yok");
    return null;
  }

  console.log("✅ Cookie'den Okundu");
  return JSON.parse(decodeURIComponent(cookieVeri.split("=")[1]));
}

export function oturumTemizle() {
  console.log("🗑️ Oturum Temizleniyor...");
  localStorage.removeItem("kullanici");
  document.cookie = "kullanici=; path=/; max-age=0";
  console.log("✅ Oturum Temizlendi");
}
