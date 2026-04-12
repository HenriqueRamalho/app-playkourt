import Link from 'next/link';

const sports = [
  { emoji: '🏐', label: 'Vôlei' },
  { emoji: '⚽', label: 'Futebol' },
  { emoji: '🎾', label: 'Tênis' },
  { emoji: '🏀', label: 'Basquete' },
  { emoji: '🏸', label: 'Badminton' },
  { emoji: '🎱', label: 'Sinuca' },
];

const benefits = [
  {
    emoji: '🔍',
    title: 'Encontre quadras perto de você',
    description: 'Busque por esporte, localização e horário disponível em segundos.',
  },
  {
    emoji: '📅',
    title: 'Reserve com um clique',
    description: 'Sem ligações, sem espera. Confirme sua reserva direto pelo app.',
  },
  {
    emoji: '🏟️',
    title: 'Para gestores de venues',
    description: 'Gerencie suas quadras, horários e reservas em um só lugar.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Hero */}
      <section className="relative bg-green-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, white 40px, white 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, white 40px, white 41px)' }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-28 flex flex-col items-center text-center gap-8">
          <div className="inline-flex items-center gap-2 bg-green-800 border border-green-700 rounded-full px-4 py-1.5 text-green-300 text-xs font-medium tracking-wide uppercase">
            🎾 Plataforma de quadras esportivas
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Sua próxima partida<br />
            <span className="text-green-400">começa aqui.</span>
          </h1>
          <p className="text-green-200 text-lg max-w-xl">
            Encontre quadras disponíveis, faça reservas em minutos e jogue mais. Simples assim.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-green-400 text-green-950 font-bold rounded-xl hover:bg-green-300 transition-colors text-sm"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/go"
              className="px-8 py-3 bg-transparent border border-green-600 text-green-200 font-medium rounded-xl hover:bg-green-800 transition-colors text-sm"
            >
              Explorar quadras →
            </Link>
          </div>
        </div>
      </section>

      {/* Esportes */}
      <section className="bg-green-950 py-5 border-y border-green-800">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center gap-8 flex-wrap">
          {sports.map(({ emoji, label }) => (
            <div key={label} className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <span className="text-xl">{emoji}</span>
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section className="max-w-5xl mx-auto px-6 py-24 w-full">
        <p className="text-xs font-semibold text-green-600 uppercase tracking-widest text-center mb-3">Por que Playkourt?</p>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">Tudo que você precisa para jogar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {benefits.map(({ emoji, title, description }) => (
            <div key={title} className="bg-gray-50 rounded-2xl p-7 border border-gray-100 flex flex-col gap-3">
              <span className="text-3xl">{emoji}</span>
              <h3 className="font-bold text-gray-900 text-base">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-gray-50 border-y border-gray-100 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-widest text-center mb-3">Simples e rápido</p>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">Como funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crie sua conta', description: 'Cadastro gratuito em menos de 1 minuto.' },
              { step: '02', title: 'Escolha a quadra', description: 'Filtre por esporte, bairro e horário disponível.' },
              { step: '03', title: 'Jogue!', description: 'Receba a confirmação e apareça na hora marcada.' },
            ].map(({ step, title, description }) => (
              <div key={step} className="flex flex-col gap-3">
                <span className="text-4xl font-black text-green-200">{step}</span>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-5xl mx-auto px-6 py-24 w-full flex flex-col items-center text-center gap-6">
        <h2 className="text-3xl font-bold text-gray-900">Pronto para jogar?</h2>
        <p className="text-gray-500 max-w-sm">Junte-se a jogadores que já usam o Playkourt para reservar quadras sem complicação.</p>
        <Link
          href="/auth/register"
          className="px-10 py-3 bg-green-700 text-white font-bold rounded-xl hover:bg-green-600 transition-colors text-sm"
        >
          Começar agora — é grátis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>🎾 Playkourt — {new Date().getFullYear()}</span>
          <div className="flex gap-6">
            <Link href="/auth/login" className="hover:text-gray-600 transition-colors">Entrar</Link>
            <Link href="/auth/register" className="hover:text-gray-600 transition-colors">Criar conta</Link>
            <Link href="/admin" className="hover:text-gray-600 transition-colors">Para gestores</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
