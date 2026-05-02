export default function Yukleniyor() {
  const yazi = "GEROPİTAL";

  return (
    <main className="min-h-screen kurumsal-arka-plan flex items-center justify-center p-6">
      <div className="kurumsal-kart rounded-3xl p-10 text-center">
        <div className="flex justify-center gap-1 text-4xl font-black tracking-widest text-[#144a7b]">
          {yazi.split("").map((harf, index) => (
            <span
              key={index}
              className="animate-pulse"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              {harf}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-500">
          İş Talimatı sistemi hazırlanıyor...
        </p>
      </div>
    </main>
  );
}
