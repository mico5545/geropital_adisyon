import Image from "next/image";

export default function KurumsalLogo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo-geropital.png"
        alt="Geropital Evde Sağlık ve Bakım"
        width={230}
        height={80}
        priority
        className="h-14 w-auto object-contain"
      />
    </div>
  );
}
