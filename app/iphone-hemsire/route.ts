export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://bagdpvuujltcysniukry.supabase.co";

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_7iNM53rPPMlbZM_GxbBIxw_dJP6RQqw";

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Geropital Hemşire Paneli</title>

  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f3f7fb;
      color: #0f172a;
    }

    header {
      background: white;
      border-bottom: 1px solid #dbe7f3;
      padding: 16px;
    }

    .logo {
      height: 52px;
      display: block;
      margin-bottom: 10px;
    }

    h1 {
      color: #144a7b;
      font-size: 22px;
      margin: 0;
    }

    .aciklama {
      color: #64748b;
      margin-top: 6px;
      font-size: 14px;
    }

    .sayfa {
      padding: 14px;
      padding-bottom: 40px;
    }

    .kart {
      background: white;
      border: 1px solid #dbe7f3;
      border-radius: 18px;
      padding: 16px;
      margin-bottom: 14px;
      box-shadow: 0 8px 24px rgba(15, 41, 66, 0.06);
    }

    .hasta-adi {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .satir {
      color: #475569;
      font-size: 14px;
      margin: 5px 0;
    }

    .rozet {
      display: inline-block;
      background: #e8f1fb;
      color: #144a7b;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 800;
      margin-top: 8px;
    }

    button {
      width: 100%;
      border: 0;
      border-radius: 14px;
      padding: 15px;
      font-size: 16px;
      font-weight: 900;
      margin-top: 10px;
      -webkit-tap-highlight-color: transparent;
    }

    .btn-ana {
      background: #144a7b;
      color: white;
    }

    .btn-yesil {
      background: #059669;
      color: white;
    }

    .btn-turuncu {
      background: #d97706;
      color: white;
    }

    .btn-gri {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }

    input, select, textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      font-size: 16px;
      margin-top: 8px;
      margin-bottom: 8px;
      background: white;
    }

    textarea {
      min-height: 90px;
    }

    .bolum-baslik {
      font-size: 17px;
      font-weight: 900;
      margin-top: 18px;
      color: #144a7b;
    }

    .gizli {
      display: none;
    }

    .yukleniyor {
      padding: 30px;
      text-align: center;
      color: #144a7b;
      font-weight: 900;
    }

    .hizmet-kutu {
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px;
      margin-top: 8px;
    }
  </style>
</head>

<body>
  <header>
    <img src="/logo-geropital.png" class="logo" />
    <h1>Geropital Hemşire Paneli</h1>
    <div class="aciklama">iPhone uyumlu saha ekranı</div>
  </header>

  <div id="yukleniyor" class="yukleniyor">Geropital yükleniyor...</div>

  <main id="icerik" class="sayfa gizli">
    <div id="kayitlar"></div>

    <div id="detay" class="kart gizli">
      <button class="btn-gri" onclick="detayKapat()">Kaydı Kapat</button>

      <h2 id="detayHastaAdi" style="color:#144a7b;"></h2>
      <div id="detayBilgi"></div>

      <div class="bolum-baslik">Mevcut Hizmetler</div>
      <div id="detayHizmetler"></div>

      <div class="bolum-baslik">Ek Hizmet Ekle</div>
      <select id="hizmetSecimi" onchange="hizmetSecildi()">
        <option value="">Hizmet seçiniz</option>
      </select>

      <input id="hizmetFiyat" placeholder="Fiyat" />
      <textarea id="hizmetAciklama" placeholder="Ek hizmet açıklaması"></textarea>
      <button class="btn-ana" onclick="ekHizmetEkle()">Ek Hizmeti Merkeze Bildir</button>

      <div class="bolum-baslik">Ödeme Durumu</div>
      <select id="odemeDurumu">
        <option>Kredi Kartı ile Tamamı Alındı</option>
        <option>Nakit Tamamı Alındı</option>
        <option>EFT / Havale Yapılacak</option>
        <option>Tamamı Alınmadı</option>
      </select>

      <textarea id="odemeAciklama" placeholder="Ödeme açıklaması"></textarea>
      <button class="btn-yesil" onclick="odemeBildir()">Ödemeyi Bildir</button>

      <div class="bolum-baslik">Hemşire Notu</div>
      <textarea id="hemsireNotu" placeholder="Hasta işlem notu"></textarea>
      <button class="btn-ana" onclick="notKaydet()">Notu Kaydet</button>
      <button class="btn-turuncu" onclick="onayaGonder()">Merkez Onayına Gönder</button>
    </div>
  </main>

  <script>
    var SUPABASE_URL = "${supabaseUrl}";
    var SUPABASE_KEY = "${supabaseKey}";

    var kullaniciId = "";
    var kullanici = null;
    var kayitlar = [];
    var hizmetler = [];
    var seciliKayit = null;

    function parametreAl(ad) {
      var query = window.location.search.substring(1);
      var parcalar = query.split("&");

      for (var i = 0; i < parcalar.length; i++) {
        var cift = parcalar[i].split("=");

        if (decodeURIComponent(cift[0]) === ad) {
          return decodeURIComponent(cift[1] || "");
        }
      }

      return "";
    }

    function xhr(method, path, body, callback) {
      var req = new XMLHttpRequest();

      req.open(method, SUPABASE_URL + "/rest/v1/" + path, true);
      req.setRequestHeader("apikey", SUPABASE_KEY);
      req.setRequestHeader("Authorization", "Bearer " + SUPABASE_KEY);
      req.setRequestHeader("Content-Type", "application/json");
      req.setRequestHeader("Prefer", "return=representation");

      req.onreadystatechange = function () {
        if (req.readyState === 4) {
          if (req.status >= 200 && req.status < 300) {
            try {
              callback(null, JSON.parse(req.responseText || "[]"));
            } catch (e) {
              callback(null, []);
            }
          } else {
            callback(req.responseText || "İstek hatası", null);
          }
        }
      };

      req.send(body ? JSON.stringify(body) : null);
    }

    function baslat() {
      kullaniciId = parametreAl("kullaniciId");

      if (!kullaniciId) {
        alert("Kullanıcı bilgisi bulunamadı. Lütfen iPhone giriş ekranından tekrar giriş yapın.");
        window.location.href = "/iphone-giris";
        return;
      }

      kullaniciGetir();
    }

    function kullaniciGetir() {
      xhr(
        "GET",
        "kullanicilar?select=id,ad_soyad,rol,aktif&id=eq." + encodeURIComponent(kullaniciId) + "&aktif=eq.true",
        null,
        function (err, data) {
          if (err || !data || !data[0]) {
            alert("Kullanıcı doğrulanamadı.");
            window.location.href = "/iphone-giris";
            return;
          }

          kullanici = data[0];

          if (kullanici.rol !== "hemsire") {
            alert("Bu ekran sadece hemşire kullanıcısı içindir.");
            window.location.href = "/iphone-giris";
            return;
          }

          hizmetleriGetir();
        }
      );
    }

    function hizmetleriGetir() {
      xhr(
        "GET",
        "hizmet_katalogu?select=id,hizmet_adi,fiyat,aciklama,aktif&aktif=eq.true&order=hizmet_adi.asc",
        null,
        function (err, data) {
          hizmetler = data || [];
          hizmetSelectDoldur();
          kayitlariGetir();
        }
      );
    }

    function kayitlariGetir() {
      xhr(
        "GET",
        "hasta_kayitlari?select=id,durum,odeme_durumu,merkez_notu,hemsire_notu,plan_tarihi,plan_saati,olusturma_tarihi,hastalar(hasta_adi,telefon,adres),hasta_hizmetleri(id,hizmet_adi,hizmet_tipi,adet,birim_fiyat,aciklama)&hemsire_id=eq." + encodeURIComponent(kullaniciId) + "&durum=neq.Kapalı&order=plan_tarihi.asc",
        null,
        function (err, data) {
          if (err) {
            alert("Kayıtlar alınamadı.");
            console.log(err);
          }

          kayitlar = data || [];

          document.getElementById("yukleniyor").className = "gizli";
          document.getElementById("icerik").className = "sayfa";

          kayitlariCiz();
        }
      );
    }

    function hastaBilgisi(kayit) {
      if (!kayit.hastalar) return {};
      if (kayit.hastalar.length) return kayit.hastalar[0];
      return kayit.hastalar;
    }

    function toplamHesapla(kayit) {
      var toplam = 0;
      var hizmetListesi = kayit.hasta_hizmetleri || [];

      for (var i = 0; i < hizmetListesi.length; i++) {
        toplam += Number(hizmetListesi[i].adet || 1) * Number(hizmetListesi[i].birim_fiyat || 0);
      }

      return toplam;
    }

    function kayitlariCiz() {
      var alan = document.getElementById("kayitlar");

      if (!kayitlar.length) {
        alan.innerHTML = '<div class="kart">Size atanmış aktif kayıt bulunmuyor.</div>';
        return;
      }

      var html = "";

      for (var i = 0; i < kayitlar.length; i++) {
        var k = kayitlar[i];
        var h = hastaBilgisi(k);
        var plan = (k.plan_tarihi || "-") + " / " + ((k.plan_saati || "-").substring(0, 5));

        html += '<div class="kart">';
        html += '<div class="hasta-adi">' + (h.hasta_adi || "Hasta adı yok") + '</div>';
        html += '<div class="satir">' + (h.telefon || "Telefon yok") + '</div>';
        html += '<div class="satir">' + (h.adres || "Adres yok") + '</div>';
        html += '<div class="rozet">Plan: ' + plan + '</div>';
        html += '<div class="satir"><b>Toplam:</b> ' + toplamHesapla(k).toLocaleString("tr-TR") + ' TL</div>';
        html += '<div class="satir"><b>Durum:</b> ' + k.durum + '</div>';
        html += '<div class="satir"><b>Ödeme:</b> ' + k.odeme_durumu + '</div>';
        html += '<button class="btn-ana" onclick="kayitAc(' + i + ')">Kaydı Aç</button>';
        html += '</div>';
      }

      alan.innerHTML = html;
    }

    function hizmetSelectDoldur() {
      var select = document.getElementById("hizmetSecimi");
      var html = '<option value="">Hizmet seçiniz</option>';

      for (var i = 0; i < hizmetler.length; i++) {
        html += '<option value="' + hizmetler[i].id + '">' +
          hizmetler[i].hizmet_adi + " - " + Number(hizmetler[i].fiyat).toLocaleString("tr-TR") + " TL" +
          '</option>';
      }

      select.innerHTML = html;
    }

    function kayitAc(index) {
      seciliKayit = kayitlar[index];

      var h = hastaBilgisi(seciliKayit);

      document.getElementById("detay").className = "kart";
      document.getElementById("detayHastaAdi").innerHTML = h.hasta_adi || "Hasta adı yok";
      document.getElementById("detayBilgi").innerHTML =
        '<div class="satir">' + (h.telefon || "Telefon yok") + '</div>' +
        '<div class="satir">' + (h.adres || "Adres yok") + '</div>' +
        '<div class="satir"><b>Merkez Notu:</b> ' + (seciliKayit.merkez_notu || "-") + '</div>';

      document.getElementById("hemsireNotu").value = seciliKayit.hemsire_notu || "";
      document.getElementById("odemeDurumu").value = seciliKayit.odeme_durumu || "Tamamı Alınmadı";

      hizmetleriCiz();

      setTimeout(function () {
        document.getElementById("detay").scrollIntoView();
      }, 100);
    }

    function detayKapat() {
      seciliKayit = null;
      document.getElementById("detay").className = "kart gizli";
    }

    function hizmetleriCiz() {
      var alan = document.getElementById("detayHizmetler");
      var liste = seciliKayit.hasta_hizmetleri || [];

      if (!liste.length) {
        alan.innerHTML = '<div class="satir">Henüz hizmet yok.</div>';
        return;
      }

      var html = "";

      for (var i = 0; i < liste.length; i++) {
        var h = liste[i];

        html += '<div class="hizmet-kutu">';
        html += '<b>' + h.hizmet_adi + '</b>';
        html += '<div>' + (Number(h.adet || 1) * Number(h.birim_fiyat || 0)).toLocaleString("tr-TR") + ' TL</div>';
        html += '<div class="satir">' + (h.aciklama || "") + '</div>';
        html += '</div>';
      }

      alan.innerHTML = html;
    }

    function hizmetSecildi() {
      var id = document.getElementById("hizmetSecimi").value;

      for (var i = 0; i < hizmetler.length; i++) {
        if (hizmetler[i].id === id) {
          document.getElementById("hizmetFiyat").value = hizmetler[i].fiyat;
          document.getElementById("hizmetAciklama").value = hizmetler[i].aciklama || "";
          return;
        }
      }
    }

    function bildirimEkle(tip, baslik, mesaj) {
      xhr(
        "POST",
        "bildirimler",
        {
          tip: tip,
          hasta_kaydi_id: seciliKayit.id,
          baslik: baslik,
          mesaj: mesaj,
          okundu: false
        },
        function () {}
      );
    }

    function kayitDurumuGuncelle(ekAlanlar, callback) {
      xhr(
        "PATCH",
        "hasta_kayitlari?id=eq." + seciliKayit.id,
        ekAlanlar,
        function (err) {
          if (callback) callback(err);
        }
      );
    }

    function ekHizmetEkle() {
      if (!seciliKayit) return;

      var hizmetId = document.getElementById("hizmetSecimi").value;
      var hizmet = null;

      for (var i = 0; i < hizmetler.length; i++) {
        if (hizmetler[i].id === hizmetId) hizmet = hizmetler[i];
      }

      if (!hizmet) {
        alert("Hizmet seçiniz.");
        return;
      }

      xhr(
        "POST",
        "hasta_hizmetleri",
        {
          hasta_kaydi_id: seciliKayit.id,
          hizmet_adi: hizmet.hizmet_adi,
          hizmet_tipi: "Hemşire Ek Hizmeti",
          adet: 1,
          birim_fiyat: Number(document.getElementById("hizmetFiyat").value || 0),
          ekleyen_kullanici_id: kullaniciId,
          aciklama: document.getElementById("hizmetAciklama").value || ""
        },
        function (err) {
          if (err) {
            alert("Ek hizmet eklenemedi.");
            return;
          }

          kayitDurumuGuncelle({ durum: "Merkez Onayı Bekliyor" }, function () {
            bildirimEkle(
              "ek_hizmet",
              "Hemşire ek hizmet bildirdi",
              kullanici.ad_soyad + " ek hizmet ekledi: " + hizmet.hizmet_adi
            );

            alert("Ek hizmet merkeze bildirildi.");
            kayitlariGetir();
          });
        }
      );
    }

    function odemeBildir() {
      if (!seciliKayit) return;

      var odemeDurumu = document.getElementById("odemeDurumu").value;
      var aciklama = document.getElementById("odemeAciklama").value || "";
      var hemsireNotu = document.getElementById("hemsireNotu").value || "";

      xhr(
        "POST",
        "odemeler",
        {
          hasta_kaydi_id: seciliKayit.id,
          odeme_durumu: odemeDurumu,
          aciklama: aciklama,
          ekleyen_kullanici_id: kullaniciId
        },
        function () {
          kayitDurumuGuncelle(
            {
              odeme_durumu: odemeDurumu,
              hemsire_notu: hemsireNotu,
              durum: "Merkez Onayı Bekliyor"
            },
            function () {
              bildirimEkle(
                "odeme",
                "Hemşire ödeme bildirdi",
                kullanici.ad_soyad + " ödeme durumu bildirdi: " + odemeDurumu
              );

              alert("Ödeme durumu merkeze bildirildi.");
              kayitlariGetir();
            }
          );
        }
      );
    }

    function notKaydet() {
      if (!seciliKayit) return;

      kayitDurumuGuncelle(
        {
          hemsire_notu: document.getElementById("hemsireNotu").value || ""
        },
        function () {
          alert("Not kaydedildi.");
          kayitlariGetir();
        }
      );
    }

    function onayaGonder() {
      if (!seciliKayit) return;

      kayitDurumuGuncelle(
        {
          durum: "Merkez Onayı Bekliyor",
          hemsire_notu: document.getElementById("hemsireNotu").value || ""
        },
        function () {
          bildirimEkle(
            "onay",
            "Hemşire merkez onayı istedi",
            kullanici.ad_soyad + " kaydı merkez onayına gönderdi."
          );

          alert("Merkez onayına gönderildi.");
          kayitlariGetir();
        }
      );
    }

    baslat();
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
