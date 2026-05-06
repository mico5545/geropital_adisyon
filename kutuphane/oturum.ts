export function kullaniciKaydet(kullanici: unknown) {
  const veri = JSON.stringify(kullanici);

  localStorage.setItem("kullanici", veri);

  document.cookie =
    "kullanici=" +
    encodeURIComponent(veri) +
    "; path=/; max-age=604800; SameSite=Lax";
}

export function kullaniciOku() {
  const localVeri = localStorage.getItem("kullanici");

  if (localVeri) {
    return JSON.parse(localVeri);
  }

  const cookieVeri = document.cookie
    .split("; ")
    .find((satir) => satir.startsWith("kullanici="));

  if (!cookieVeri) return null;

  return JSON.parse(decodeURIComponent(cookieVeri.split("=")[1]));
}

export function oturumTemizle() {
  localStorage.removeItem("kullanici");
  document.cookie = "kullanici=; path=/; max-age=0";
}
