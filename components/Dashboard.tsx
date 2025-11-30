import React, { useState, useEffect } from 'react';
import { Participant, GiftIdea, DinnerSuggestion } from '../types';
import Countdown from './Countdown';
import { getEventDate } from '../utils/timeUtils';
import { getGiftSuggestion } from '../services/geminiService';

interface DashboardProps {
  userEmail: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userEmail }) => {
  // Simulated Target (In a real app, this comes from backend)
  // For demo, we hash the email to pick a static name so it's consistent for the user
  const possibleTargets = ["María", "Juan", "Lucía", "Carlos", "Sofía", "Diego"];
  const targetIndex = userEmail.length % possibleTargets.length;
  const targetName = possibleTargets[targetIndex];

  const [activeTab, setActiveTab] = useState<'none' | 'rules' | 'wishes' | 'dinner'>('none');
  const [wishes, setWishes] = useState<GiftIdea[]>([]);
  const [newWish, setNewWish] = useState('');
  const [suggestions, setSuggestions] = useState<DinnerSuggestion[]>([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API key safely on mount
  useEffect(() => {
    try {
      setHasApiKey(!!(typeof process !== 'undefined' && process.env && process.env.API_KEY));
    } catch {
      setHasApiKey(false);
    }
  }, []);

  // Load from local storage
  useEffect(() => {
    const savedWishes = localStorage.getItem('ns_wishes');
    if (savedWishes) setWishes(JSON.parse(savedWishes));

    const savedSuggestions = localStorage.getItem('ns_suggestions');
    if (savedSuggestions) setSuggestions(JSON.parse(savedSuggestions));
  }, []);

  const saveWishes = (newWishes: GiftIdea[]) => {
    setWishes(newWishes);
    localStorage.setItem('ns_wishes', JSON.stringify(newWishes));
  };

  const saveSuggestions = (newSuggestions: DinnerSuggestion[]) => {
    setSuggestions(newSuggestions);
    localStorage.setItem('ns_suggestions', JSON.stringify(newSuggestions));
  };

  const addWish = () => {
    if (!newWish.trim()) return;
    const wish: GiftIdea = {
      id: Date.now().toString(),
      item: newWish,
      forEmail: userEmail,
    };
    saveWishes([...wishes, wish]);
    setNewWish('');
  };

  const addSuggestion = () => {
    if (!newSuggestion.trim()) return;
    const suggestion: DinnerSuggestion = {
      id: Date.now().toString(),
      dish: newSuggestion,
      author: userEmail.split('@')[0],
    };
    saveSuggestions([...suggestions, suggestion]);
    setNewSuggestion('');
  };

  const handleAskAI = async () => {
    if(!aiPrompt) return;
    setIsLoadingAi(true);
    setAiResponse('');
    const ideas = await getGiftSuggestion(aiPrompt);
    setAiResponse(ideas);
    setIsLoadingAi(false);
  }

  // Filter wishes: You see wishes of the person you have to gift (simulated by checking if NOT your own for demo purposes, 
  // or normally we would filter by targetEmail. Since we don't have a real DB of emails, we will show "Public Wishes" 
  // excluding our own to simulate the experience).
  const visibleWishes = wishes.filter(w => w.forEmail !== userEmail);
  const myWishes = wishes.filter(w => w.forEmail === userEmail);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
      
      {/* Target Reveal Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-12 border-2 border-yellow-500/50 text-center shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-fade-in-up">
        <h3 className="text-xl text-yellow-200 uppercase tracking-widest mb-2">Tu Amigo Invisible es</h3>
        <div className="text-5xl festive-font text-white drop-shadow-lg mb-4 transform hover:scale-105 transition-transform duration-300">
          {targetName}
        </div>
        <p className="text-sm text-gray-200 italic">¡Shhh! Es un secreto.</p>
      </div>

      {/* Main Event Countdown */}
      <Countdown 
        targetDate={getEventDate()} 
        title="Tiempo para la Entrega" 
        className="mb-12"
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
        <button 
          onClick={() => setActiveTab('rules')}
          className="bg-green-800 hover:bg-green-700 text-white p-6 rounded-xl shadow-lg border-b-4 border-green-900 transition-all flex flex-col items-center gap-2 group"
        >
          <i className="fas fa-scroll text-3xl group-hover:rotate-12 transition-transform"></i>
          <span className="font-bold text-lg">Reglas</span>
        </button>
        <button 
          onClick={() => setActiveTab('wishes')}
          className="bg-red-700 hover:bg-red-600 text-white p-6 rounded-xl shadow-lg border-b-4 border-red-900 transition-all flex flex-col items-center gap-2 group"
        >
          <i className="fas fa-gift text-3xl group-hover:-translate-y-1 transition-transform"></i>
          <span className="font-bold text-lg">Ideas de Regalos</span>
        </button>
        <button 
          onClick={() => setActiveTab('dinner')}
          className="bg-yellow-600 hover:bg-yellow-500 text-white p-6 rounded-xl shadow-lg border-b-4 border-yellow-800 transition-all flex flex-col items-center gap-2 group"
        >
          <i className="fas fa-utensils text-3xl group-hover:scale-110 transition-transform"></i>
          <span className="font-bold text-lg">Cena Navideña</span>
        </button>
      </div>

      {/* Modals / Content Sections */}
      {activeTab !== 'none' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-50 text-gray-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-red-700 p-4 flex justify-between items-center text-white">
              <h2 className="text-2xl festive-font font-bold">
                {activeTab === 'rules' && 'Reglas del Juego'}
                {activeTab === 'wishes' && 'Lista de Deseos'}
                {activeTab === 'dinner' && 'Menú de Navidad'}
              </h2>
              <button onClick={() => setActiveTab('none')} className="hover:text-yellow-300 transition-colors">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              
              {/* RULES SECTION */}
              {activeTab === 'rules' && (
                <div className="space-y-4 text-lg">
                  <p>🎅 <span className="font-bold">Presupuesto:</span> 15€.</p>
                  <p>🤫 <span className="font-bold">Secreto:</span> Nadie puede revelar su identidad hasta el día 22, si como TayTay.</p>
                  <p>🎁 <span className="font-bold">Regalo:</span> El regalo puede ser todo lo creativo que quieras o farlopa.</p>
                  <p>📌 <span className="font-bold">Lugar:</span> Todavia por confirmar. Incluso por pensar.</p>
                  <p>🍹 <span className="font-bold">Bebida:</span> Paloma y Marta deberan preparar mojitos, peticion de Santa.</p>
                </div>
              )}

              {/* WISHES SECTION */}
              {activeTab === 'wishes' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h3 className="font-bold text-yellow-800 mb-2">🎁 Mis Deseos (ya no vale poner el Silksong.)
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        value={newWish}
                        onChange={(e) => setNewWish(e.target.value)}
                        placeholder="Ej: Terminar Arquitectura, el bombo a..."
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                      />
                      <button onClick={addWish} className="bg-red-600 text-white px-4 rounded hover:bg-red-700">
                        Añadir
                      </button>
                    </div>
                    <ul className="list-disc pl-5 text-sm text-gray-700">
                      {myWishes.map(wish => (
                        <li key={wish.id}>{wish.item}</li>
                      ))}
                      {myWishes.length === 0 && <li className="text-gray-400 italic">No has añadido deseos aún.</li>}
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-bold text-green-800 mb-2">🕵️ Pistas para regalar (Lo que otros quieren)</h3>
                    <ul className="list-disc pl-5 text-gray-700">
                      {visibleWishes.map(wish => (
                        <li key={wish.id}><span className="font-semibold">Alguien quiere:</span> {wish.item}</li>
                      ))}
                      {visibleWishes.length === 0 && <li className="text-gray-400 italic">Nadie ha puesto deseos todavía.</li>}
                    </ul>
                  </div>

                  {/* Gemini AI Integration */}
                   <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
                    <h3 className="font-bold text-blue-800 mb-2">🤖 ¿Sin ideas? Pregúntale a Santa Chatty (IA)</h3>
                    <div className="flex gap-2 mb-2">
                       <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ej: Le gusta el padel, ¿Verdad Noe?"
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
                      />
                      <button 
                        onClick={handleAskAI} 
                        disabled={isLoadingAi || !hasApiKey}
                        className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {isLoadingAi ? <i className="fas fa-spinner fa-spin"></i> : 'Consultar'}
                      </button>
                    </div>
                    {!hasApiKey && <p className="text-xs text-red-500">API Key no configurada en el entorno.</p>}
                    {aiResponse && (
                      <div className="mt-2 bg-white p-3 rounded border border-blue-100 text-sm whitespace-pre-wrap">
                        {aiResponse}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DINNER SECTION */}
              {activeTab === 'dinner' && (
                <div>
                   <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-orange-800 mb-2">🍗 Sugerencias para el Menú</h3>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        value={newSuggestion}
                        onChange={(e) => setNewSuggestion(e.target.value)}
                        placeholder="Ej: Empanada de pollo y setas por fa"
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-orange-500 outline-none"
                      />
                      <button onClick={addSuggestion} className="bg-orange-600 text-white px-4 rounded hover:bg-orange-700">
                        Sugerir
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map(s => (
                      <div key={s.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex justify-between items-center">
                        <span className="font-medium">{s.dish}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Sugerido por: {s.author}</span>
                      </div>
                    ))}
                     {suggestions.length === 0 && <p className="text-center text-gray-400 italic py-4">Aún no hay comida en la mesa, Josete...</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;