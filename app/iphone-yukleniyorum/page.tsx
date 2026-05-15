"use client";

import { useEffect } from "react";
import Yukleniyor from "@/bilesenler/Yukleniyor";

export default function IphoneYukleniyorum() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = window.location.search || "";
      const eslesen = url.match(/kullaniciId=([^&]+)/);
      const kullaniciId = eslesen ? decodeURIComponent(eslesen[1]) : "";

      if (kullaniciId) {
        window.location.href = `/hemsire-paneli-hafif?kullaniciId=${kullaniciId}`;
      } else {
        window.location.href = "/iphone-giris";
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return <Yukleniyor />;
}
