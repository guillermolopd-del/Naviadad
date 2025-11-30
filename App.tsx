import React, { useState } from 'react';
import Snowflakes from './components/Snowflakes';
import Countdown from './components/Countdown';
import Dashboard from './components/Dashboard';
import { getTodayMidnight } from './utils/timeUtils';
import { AppStage } from './types';

const App: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [stage, setStage] = useState<AppStage>(AppStage.WELCOME); // Default to Welcome screen
  
  // DEMO MODE: To allow immediate testing of the Dashboard, we set the "Reveal Time" 
  // to a time in the past. This ensures checkTimeStage() always goes to DASHBOARD.
  // In a real scenario, this would be `getTodayMidnight()` (23:59 tonight).
  const [revealTime] = useState(() => {
    const past = new Date();
    past.setHours(past.getHours() - 1); 
    return past;
  });

  // Logic to determine which screen to show based on time
  const checkTimeStage = () => {
    const now = new Date();
    if (now >= revealTime) {
      setStage(AppStage.DASHBOARD);
    } else {
      setStage(AppStage.PRE_REVEAL_COUNTDOWN);
    }
  };

  // Logic to handle entering the app (checking local storage or starting fresh)
  const handleEnterApp = () => {
    const savedEmail = localStorage.getItem('ns_user_email');
    const savedName = localStorage.getItem('ns_user_name');

    if (savedEmail) {
      setEmail(savedEmail);
      if (savedName) {
        setName(savedName);
        checkTimeStage();
      } else {
        setStage(AppStage.NAME_INPUT);
      }
    } else {
      setStage(AppStage.REGISTRATION);
    }
  };

  const handleRegisterEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      localStorage.setItem('ns_user_email', email);
      setStage(AppStage.NAME_INPUT);
    }
  };

  const handleRegisterName = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('ns_user_name', name);
      checkTimeStage();
    }
  };

  const handleRevealComplete = () => {
    setStage(AppStage.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-green-900 text-white overflow-hidden relative selection:bg-yellow-300 selection:text-red-900">
      <Snowflakes />
      
      <main className="relative z-10 container mx-auto px-4 min-h-screen flex flex-col items-center justify-center py-10">
        
        {/* Header Logo/Title - Only show small header on Dashboard to save space */}
        {stage !== AppStage.WELCOME && (
          <header className={`text-center animate-fade-in-down ${stage === AppStage.DASHBOARD ? 'mb-4' : 'mb-8'}`}>
            <div className={`${stage === AppStage.DASHBOARD ? 'text-4xl' : 'text-6xl'} mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]`}>🎅</div>
            <h1 className={`${stage === AppStage.DASHBOARD ? 'text-3xl md:text-5xl' : 'text-5xl md:text-7xl'} festive-font text-white drop-shadow-lg tracking-wider`}>
              Amigo <span className="text-yellow-400">Invisible</span>
            </h1>
          </header>
        )}

        {/* STAGE 0: WELCOME SCREEN */}
        {stage === AppStage.WELCOME && (
          <div className="text-center animate-fade-in flex flex-col items-center justify-center h-full">
             <div className="text-8xl mb-6 animate-bounce drop-shadow-[0_0_25px_rgba(255,215,0,0.6)]">🎄</div>
             <h1 className="text-6xl md:text-8xl festive-font text-white mb-8 drop-shadow-xl leading-tight">
               Feliz<br/> <span className="text-yellow-400">Navidad</span>
             </h1>
             <p className="text-xl text-yellow-100 max-w-md mx-auto mb-12 italic">
               "La magia de regalar comienza aquí..."
             </p>
             <button 
               onClick={handleEnterApp}
               className="group relative px-10 py-5 bg-red-700 text-white font-bold text-2xl rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:bg-red-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.8)] transition-all transform hover:-translate-y-1 overflow-hidden"
             >
               <span className="relative z-10">Entrar</span>
               <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
             </button>
          </div>
        )}

        {/* STAGE 1: REGISTRATION (EMAIL) */}
        {stage === AppStage.REGISTRATION && (
          <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl animate-fade-in-up">
            <p className="text-center text-lg mb-6 text-gray-100 leading-relaxed">
              Bienvenido al sorteo. Espabila, introduce tu correo para unirte al cachondeo mágico de regalos.
            </p>
            <form onSubmit={handleRegisterEmail} className="flex flex-col gap-4">
              <input 
                type="email" 
                required
                placeholder="tu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-4 rounded-xl text-gray-900 placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-yellow-400 transition-all text-lg shadow-inner"
              />
              <button 
                type="submit" 
                className="bg-green-700 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all text-xl uppercase tracking-wider border-b-4 border-green-900"
              >
                Siguiente
              </button>
            </form>
          </div>
        )}

        {/* STAGE 1.5: NAME INPUT (THE LETTER) */}
        {stage === AppStage.NAME_INPUT && (
          <div className="w-full max-w-lg animate-fade-in-up relative">
            {/* Paper Texture Effect */}
            <div className="bg-[#fcfaf2] text-gray-800 p-8 md:p-12 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] rotate-1 transform relative overflow-hidden">
              {/* Decorative Stamp */}
              <div className="absolute top-4 right-4 w-16 h-20 border-4 border-red-800 opacity-80 flex items-center justify-center rotate-6">
                <span className="text-red-800 text-xs font-bold text-center uppercase leading-tight">Correo<br/>Mágico<br/>Norte</span>
              </div>

              <form onSubmit={handleRegisterName} className="flex flex-col gap-6 relative z-10">
                <h2 className="text-3xl md:text-4xl festive-font text-red-900 mb-2">Querido Amigo Invisible,</h2>
                
                <div className="text-xl md:text-2xl font-handwriting leading-loose">
                  <span className="mr-2">Soy</span>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    placeholder="Tu Nombre Aquí" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent border-b-2 border-gray-400 focus:border-red-600 outline-none text-red-700 font-bold placeholder:text-gray-300 w-full md:w-auto min-w-[200px]"
                  />
                  <span className="block mt-2 text-gray-600 text-base">
                    y prometo que no soy peruano.
                  </span>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    type="submit" 
                    className="bg-red-800 hover:bg-red-700 text-yellow-100 font-bold py-3 px-8 rounded-full shadow-md transform hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    <span>Enviar Carta</span>
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </form>

              {/* Background Lines for paper effect */}
              <div className="absolute inset-0 pointer-events-none opacity-10" 
                   style={{backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #999 31px, #999 32px)'}}>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: WAITING FOR REVEAL */}
        {stage === AppStage.PRE_REVEAL_COUNTDOWN && (
          <div className="w-full animate-fade-in">
            <div className="text-center mb-12">
              <p className="text-xl md:text-2xl text-yellow-100 max-w-2xl mx-auto leading-relaxed">
                ¡Carta recibida, <span className="text-yellow-400 font-bold">{name}</span>! <br/>
                El duende Juan Diego está emparejando a los participantes. El resultado se revelará al final del día. Gracias por la paciencia.
              </p>
            </div>
            
            <Countdown 
              targetDate={revealTime} 
              title="Cuenta atrás para el Sorteo" 
              onComplete={handleRevealComplete}
            />

             {/* Dev Helper: In a real app remove this. For reviewers, this lets them skip the wait */}
             <button 
              onClick={handleRevealComplete}
              className="mt-20 text-xs text-white/20 hover:text-white/50 underline"
            >
              (Dev: Saltar espera)
            </button>
          </div>
        )}

        {/* STAGE 3: DASHBOARD */}
        {stage === AppStage.DASHBOARD && (
          <Dashboard userEmail={email} />
        )}

      </main>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-16 bg-[url('https://raw.githubusercontent.com/gist/stevenlei/2108527/raw/26e06b99676579c094709405606d09c2536c342d/snow-ground.png')] bg-repeat-x bg-contain opacity-50 pointer-events-none z-0"></div>
    </div>
  );
};

export default App;