export default function Yukleniyor() {
  const yazi = "GEROPİTAL";

  return (
    <main className="min-h-screen kurumsal-arka-plan flex items-center justify-center p-6">
      <div className="kurumsal-kart rounded-3xl p-10 text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo-geropital.png"
            alt="Geropital"
            className="h-16 w-auto object-contain"
          />
        </div>

        <div className="flex justify-center gap-1 text-4xl font-black tracking-widest text-[#144a7b]">
          {yazi.split("").map((harf, index) => (
            <span
              key={index}
              className="daktilo-harf"
              style={{ animationDelay: `${index * 130}ms` }}
            >
              {harf}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-500">
          Sayfa hazırlanıyor...
        </p>
      </div>
    </main>
  );
}