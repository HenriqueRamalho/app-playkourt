import Link from 'next/link';

const Animation = () => (
  <div className="relative w-full max-w-lg h-72">
    <div className="absolute top-4 right-8 w-12 h-12 bg-yellow-300 rounded-full shadow-lg animate-pulse" />

    <div className="absolute animate-[volleyball_2s_ease-in-out_infinite]" style={{ left: '50%', top: '20%' }}>
      <div className="w-8 h-8 bg-white rounded-full border-2 border-gray-300 shadow-md flex items-center justify-center">
        <div className="w-6 h-0.5 bg-gray-300 rounded" />
        <div className="absolute w-0.5 h-6 bg-gray-300 rounded" />
      </div>
    </div>

    <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center">
      <div className="w-full h-0.5 bg-gray-800" />
      <div className="flex w-full justify-between px-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-0.5 h-8 bg-gray-600" />
        ))}
      </div>
      <div className="w-full h-0.5 bg-gray-800" />
    </div>

    <div className="absolute bottom-16 left-12 animate-[jumpLeft_2s_ease-in-out_infinite]">
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 bg-orange-400 rounded-full" />
        <div className="w-3 h-8 bg-blue-500 rounded-sm mt-0.5" />
        <div className="flex gap-1 mt-0.5">
          <div className="w-1.5 h-4 bg-blue-700 rounded-sm" />
          <div className="w-1.5 h-4 bg-blue-700 rounded-sm" />
        </div>
      </div>
    </div>

    <div className="absolute bottom-16 right-12 animate-[jumpRight_2s_ease-in-out_infinite]">
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 bg-orange-400 rounded-full" />
        <div className="w-3 h-8 bg-pink-500 rounded-sm mt-0.5" />
        <div className="flex gap-1 mt-0.5">
          <div className="w-1.5 h-4 bg-pink-700 rounded-sm" />
          <div className="w-1.5 h-4 bg-pink-700 rounded-sm" />
        </div>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-16 bg-yellow-200 rounded-b-xl" />

    <style>{`
      @keyframes volleyball {
        0%, 100% { transform: translateX(-40px) translateY(0px); }
        25%       { transform: translateX(0px)   translateY(-80px); }
        50%       { transform: translateX(40px)  translateY(0px); }
        75%       { transform: translateX(0px)   translateY(-80px); }
      }
      @keyframes jumpLeft {
        0%, 100% { transform: translateY(0px); }
        25%       { transform: translateY(-20px); }
        50%, 75%  { transform: translateY(0px); }
      }
      @keyframes jumpRight {
        0%, 50%  { transform: translateY(0px); }
        75%       { transform: translateY(-20px); }
        100%      { transform: translateY(0px); }
      }
    `}</style>
  </div>
);

const features = [
  { href: '/auth/login', label: 'Autenticação', emoji: '🔐' },
  { href: '/venue', label: 'Venues', emoji: '🏟️' },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-sky-50 px-4 py-16 overflow-hidden">
      <div className="w-full max-w-2xl flex flex-col items-center gap-12">

        <div className="text-center">
          <p className="text-sky-700 font-semibold tracking-widest uppercase text-xs mb-3">Bem-vindo ao</p>
          <h1 className="text-4xl font-bold text-gray-900">Playkourt</h1>
          <p className="mt-3 text-gray-500 text-sm max-w-sm mx-auto">
            Plataforma de gestão para quadras esportivas. Organize seus venues, horários e muito mais.
          </p>
        </div>

        <Animation />

        <div className="w-full">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Funcionalidades disponíveis</p>
          <ul className="flex flex-col gap-1">
            {features.map((f) => (
              <li key={f.href}>
                <Link href={f.href} className="text-sm text-blue-600 hover:text-blue-500">
                  {f.emoji} {f.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
