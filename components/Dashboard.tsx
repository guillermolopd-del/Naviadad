import React, { useState, useEffect } from 'react';
import { GiftIdea, DinnerSuggestion, HighScore } from '../types';
import Countdown from './Countdown';
import { getEventDate } from '../utils/timeUtils';
import { secretSantaAssignments } from '../config';
import { db } from '../firebaseConfig';
import { ref, onValue, push, remove } from 'firebase/database';
import PadelGame from './PadelGame';

interface DashboardProps {
  userEmail: string;
}

// ==============================================================================
// 🎄 CONFIGURACIÓN DEL CALENDARIO DE ADVIENTO 🎄
// ==============================================================================
const adventImages: Record<number, string> = {
  // --- SEMANA 1 ---
  1:  "https://i.imgur.com/JrBjM1D.jpeg", // ✅ Fíjate que termina en .jpg (Foto real)
  2:  "https://i.imgur.com/XCTsxvE.jpeg", 
  3:  "https://i.imgur.com/oasB3TS.jpeg",
  4:  "https://i.imgur.com/zvpV0Fm.jpeg",
  5:  "https://i.imgur.com/VjEaBQs.jpeg",
  6:  "https://i.imgur.com/8HupUGX.jpeg",
  7:  "https://i.imgur.com/aAdv1q2.jpeg",
  
  // --- SEMANA 2 ---
  8:  "https://i.imgur.com/QKrSErS.jpeg",
  9:  "https://i.imgur.com/MMyeIGC.jpeg",
  10: "https://i.imgur.com/FGCIfnD.jpeg",
  11: "https://i.imgur.com/tTLnaWp.jpeg",
  12: "https://i.imgur.com/v4T0ula.jpeg",
  13: "https://i.imgur.com/vW1Egdz.jpeg",
  14: "https://images.unsplash.com/photo-1511525380295-c1fc35db0041?auto=format&fit=crop&w=800&q=80",
  
  // --- SEMANA 3 ---
  15: "https://images.unsplash.com/photo-1577045167527-775677987244?auto=format&fit=crop&w=800&q=80",
  16: "https://images.unsplash.com/photo-1457296898342-cdd24585d095?auto=format&fit=crop&w=800&q=80",
  17: "https://images.unsplash.com/photo-1512413914633-b5043f4041ea?auto=format&fit=crop&w=800&q=80",
  18: "https://images.unsplash.com/photo-1576615278693-01d782729a8e?auto=format&fit=crop&w=800&q=80",
  19: "https://images.unsplash.com/photo-1529973625058-a665431328fb?auto=format&fit=crop&w=800&q=80",
  20: "https://images.unsplash.com/photo-1480632558668-a3294c7a7e8e?auto=format&fit=crop&w=800&q=80",
  21: "https://images.unsplash.com/photo-1575298539255-a5a40954b9d0?auto=format&fit=crop&w=800&q=80",
  
  // --- DÍA FINAL ---
  22: "https://images.unsplash.com/photo-1544211326-d626359eb368?auto=format&fit=crop&w=800&q=80",
};


const Dashboard: React.FC<DashboardProps> = ({ userEmail }) => {
  // Logic to determine Target Name
  const normalizedEmail = userEmail.toLowerCase().trim();
  let targetName = secretSantaAssignments[normalizedEmail] || "Error: Participante no encontrado";
  const userName = localStorage.getItem('ns_user_name') || userEmail.split('@')[0];

  const [activeTab, setActiveTab] = useState<'none' | 'rules' | 'wishes' | 'dinner' | 'advent' | 'minigames'>('none');
  const [wishes, setWishes] = useState<GiftIdea[]>([]);
  const [newWish, setNewWish] = useState('');
  const [suggestions, setSuggestions] = useState<DinnerSuggestion[]>([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  
  // Game States
  const [padelHighScores, setPadelHighScores] = useState<HighScore[]>([]);

  const [isRevealed, setIsRevealed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Advent Calendar State
  const [viewingDay, setViewingDay] = useState<number | null>(null);

  // --- FIREBASE SYNC ---
  // Cargar Deseos y Cenas en tiempo real
  useEffect(() => {
    // Escuchar cambios en "wishes"
    const wishesRef = ref(db, 'wishes');
    const unsubscribeWishes = onValue(wishesRef, (snapshot) => {
      const data = snapshot.val();
      const wishesList: GiftIdea[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          wishesList.push({
            ...data[key],
            id: key // Usamos la key de firebase como ID
          });
        });
      }
      setWishes(wishesList);
    });

    // Escuchar cambios en "suggestions" (Cena)
    const suggestionsRef = ref(db, 'dinner_suggestions');
    const unsubscribeSuggestions = onValue(suggestionsRef, (snapshot) => {
      const data = snapshot.val();
      const suggestionsList: DinnerSuggestion[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          suggestionsList.push({
            ...data[key],
            id: key
          });
        });
      }
      setSuggestions(suggestionsList);
    });

    return () => {
      unsubscribeWishes();
      unsubscribeSuggestions();
    };
  }, []);

  // Cargar Leaderboards solo cuando se abre la pestaña de minijuegos
  useEffect(() => {
    if (activeTab === 'minigames') {
        // PADEL
        const padelRef = ref(db, 'leaderboard_padel');
        const unsubPadel = onValue(padelRef, (snapshot) => {
            const data = snapshot.val();
            const scoresList: HighScore[] = [];
            if (data) {
                Object.keys(data).forEach(key => scoresList.push({ ...data[key], id: key }));
            }
            scoresList.sort((a, b) => b.score - a.score);
            setPadelHighScores(scoresList.slice(0, 20));
        });

        return () => {
            unsubPadel();
        };
    }
  }, [activeTab]);

  const addWish = () => {
    if (!newWish.trim()) return;
    setIsSaving(true);
    const wishesRef = ref(db, 'wishes');
    const newWishObj = {
      item: newWish,
      forEmail: userEmail,
      authorName: userName, // NEW: Save author name
      timestamp: Date.now()
    };
    push(wishesRef, newWishObj)
      .then(() => {
        setNewWish('');
        setIsSaving(false);
      })
      .catch((error) => {
        setIsSaving(false);
        alert("❌ Error al guardar: " + error.message + "\n\n⚠️ IMPORTANTE: Asegúrate de haber puesto las Reglas de Firebase en '.write': true");
      });
  };

  const deleteWish = (wishId: string) => {
    // Solo permitir borrar si es tuyo (validación simple en frontend)
    const wishToDelete = wishes.find(w => w.id === wishId);
    if (wishToDelete && wishToDelete.forEmail === userEmail) {
      const wishRef = ref(db, `wishes/${wishId}`);
      remove(wishRef).catch(error => alert("Error al borrar: " + error.message));
    }
  };

  const addSuggestion = () => {
    if (!newSuggestion.trim()) return;
    setIsSaving(true);
    const suggestionsRef = ref(db, 'dinner_suggestions');
    const newSuggestionObj = {
      dish: newSuggestion,
      author: userName,
      timestamp: Date.now()
    };
    push(suggestionsRef, newSuggestionObj)
      .then(() => {
        setNewSuggestion('');
        setIsSaving(false);
      })
      .catch((error) => {
        setIsSaving(false);
        alert("❌ Error al guardar: " + error.message + "\n\n⚠️ IMPORTANTE: Asegúrate de haber puesto las Reglas de Firebase en '.write': true");
      });
  };

  // --- ADVENT LOGIC ---
  const isDayUnlocked = (day: number) => {
    const now = new Date();
    // Permitir ver si ya pasó la fecha (lógica simple para año actual)
    if (now.getMonth() === 11) { // Diciembre es 11
        return now.getDate() >= day;
    }
    // Si no es diciembre, bloqueado (o desbloqueado si es año siguiente, lógica simple)
    return now.getMonth() < 11 ? false : true;
  };

  const handleDayClick = (day: number) => {
    if (isDayUnlocked(day)) {
        setViewingDay(day);
    } else {
        alert("¡Epa! No hagas trampas, este día aún no ha llegado 🎅🔒");
    }
  };

  const visibleWishes = wishes.filter(w => w.forEmail !== userEmail);
  const myWishes = wishes.filter(w => w.forEmail === userEmail);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
      
      {/* Target Reveal Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-12 border-2 border-yellow-500/50 text-center shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-fade-in-up">
        <h3 className="text-xl text-yellow-200 uppercase tracking-widest mb-4">Tu Amigo Invisible es</h3>
        
        <div 
          onClick={() => setIsRevealed(true)}
          className="relative cursor-pointer group"
        >
          <div className={`text-5xl festive-font text-white drop-shadow-lg transition-all duration-700 transform ${isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute inset-0'}`}>
            {targetName}
          </div>

          <div className={`transition-all duration-700 transform flex flex-col items-center justify-center ${isRevealed ? 'opacity-0 scale-150 pointer-events-none absolute inset-0' : 'opacity-100 scale-100'}`}>
             <div className="text-6xl animate-bounce mb-2">🎁</div>
             <p className="text-sm font-bold text-yellow-400 bg-red-900/80 px-4 py-1 rounded-full uppercase tracking-wider animate-pulse">Toca para abrir</p>
          </div>
        </div>
        
        <p className={`text-sm text-gray-200 italic mt-4 transition-opacity duration-500 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>¿Será el Lisan al Gaib?</p>
      </div>

      {/* Main Event Countdown */}
      <Countdown 
        targetDate={getEventDate()} 
        title="Tiempo para la Entrega" 
        className="mb-12"
        onComplete={() => alert("¡Ha llegado el día! 🎅🎁")}
      />

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full mb-8">
        <button 
          onClick={() => setActiveTab('rules')}
          className="bg-green-800 hover:bg-green-700 text-white p-4 rounded-xl shadow-lg border-b-4 border-green-900 transition-all flex flex-col items-center gap-2 group"
        >
          <i className="fas fa-scroll text-2xl md:text-3xl group-hover:rotate-12 transition-transform"></i>
          <span className="font-bold text-xs md:text-sm">Reglas</span>
        </button>
        <button 
          onClick={() => setActiveTab('wishes')}
          className="bg-red-700 hover:bg-red-600 text-white p-4 rounded-xl shadow-lg border-b-4 border-red-900 transition-all flex flex-col items-center gap-2 group"
        >
          <i className="fas fa-gift text-2xl md:text-3xl group-hover:-translate-y-1 transition-transform"></i>
          <span className="font-bold text-xs md:text-sm">Ideas</span>
        </button>
        <button 
          onClick={() => setActiveTab('dinner')}
          className="bg-yellow-600 hover:bg-yellow-500 text-white p-4 rounded-xl shadow-lg border-b-4 border-yellow-800 transition-all flex flex-col items-center gap-2 group"
        >
          <i className="fas fa-utensils text-2xl md:text-3xl group-hover:scale-110 transition-transform"></i>
          <span className="font-bold text-xs md:text-sm">Cena</span>
        </button>
        <button 
          onClick={() => setActiveTab('advent')}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl shadow-lg border-b-4 border-blue-800 transition-all flex flex-col items-center gap-2 group"
        >
          <i className="far fa-calendar-alt text-2xl md:text-3xl group-hover:animate-pulse transition-transform"></i>
          <span className="font-bold text-xs md:text-sm">Adviento</span>
        </button>
        <button 
          onClick={() => setActiveTab('minigames')}
          className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl shadow-lg border-b-4 border-purple-800 transition-all flex flex-col items-center gap-2 group"
        >
          <i className="fas fa-gamepad text-2xl md:text-3xl group-hover:rotate-6 transition-transform"></i>
          <span className="font-bold text-xs md:text-sm">Pádel</span>
        </button>
      </div>

      {/* Modals / Content Sections */}
      {activeTab !== 'none' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-50 text-gray-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className={`p-4 flex justify-between items-center text-white ${
                activeTab === 'advent' ? 'bg-blue-700' : 
                activeTab === 'minigames' ? 'bg-purple-700' :
                'bg-red-700'
            }`}>
              <h2 className="text-xl md:text-2xl festive-font font-bold">
                {activeTab === 'rules' && 'Reglas del Juego'}
                {activeTab === 'wishes' && 'Lista de Deseos (Online)'}
                {activeTab === 'dinner' && 'Menú de Navidad (Online)'}
                {activeTab === 'advent' && 'Calendario de Adviento'}
                {activeTab === 'minigames' && 'Pádel vs Noelia'}
              </h2>
              <button onClick={() => setActiveTab('none')} className="hover:text-yellow-300 transition-colors">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              
              {/* RULES SECTION */}
              {activeTab === 'rules' && (
                <div className="space-y-4 text-lg">
                  <p>🎅 <span className="font-bold">Presupuesto:</span> 15€.</p>
                  <p>🤫 <span className="font-bold">Secreto:</span> Nadie puede revelar su identidad hasta el día 22, si como TayTay.</p>
                  <p>🎁 <span className="font-bold">Regalo:</span> El regalo puede ser todo lo creativo que quieras, o farlopa.</p>
                  <p>📌 <span className="font-bold">Lugar:</span> Todavia por confirmar. Incluso por pensar.</p>
                  <p>🍹 <span className="font-bold">Bebida:</span> Paloma y Marta deberan preparar mojitos, peticion de Santa.</p>
                </div>
              )}

              {/* WISHES SECTION */}
              {activeTab === 'wishes' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h3 className="font-bold text-yellow-800 mb-2">🎁 Mis Deseos (ya no vale poner el Silksong.)</h3>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        value={newWish}
                        onChange={(e) => setNewWish(e.target.value)}
                        placeholder="Ej: Terminar Arquitectura, pala de padel..."
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                        disabled={isSaving}
                      />
                      <button 
                        onClick={addWish} 
                        disabled={isSaving}
                        className="bg-red-600 text-white px-4 rounded hover:bg-red-700 disabled:bg-gray-400"
                      >
                        {isSaving ? '...' : 'Añadir'}
                      </button>
                    </div>
                    <ul className="list-disc pl-5 text-sm text-gray-700">
                      {myWishes.map(wish => (
                        <li key={wish.id} className="flex justify-between items-center group">
                          <span>{wish.item}</span>
                          <button 
                            onClick={() => deleteWish(wish.id)}
                            className="text-red-400 hover:text-red-600 ml-2 opacity-50 group-hover:opacity-100"
                            title="Borrar"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </li>
                      ))}
                      {myWishes.length === 0 && <li className="text-gray-400 italic">No has añadido deseos aún.</li>}
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-bold text-green-800 mb-2">🕵️ Myri Resumen de regalos (Lo que otros quieren)</h3>
                    <ul className="list-disc pl-5 text-gray-700">
                      {visibleWishes.map(wish => (
                        <li key={wish.id}>
                          <span className="font-semibold">{wish.authorName || 'Alguien'} quiere:</span> {wish.item}
                        </li>
                      ))}
                      {visibleWishes.length === 0 && <li className="text-gray-400 italic">Nadie ha puesto deseos todavía.</li>}
                    </ul>
                  </div>
                </div>
              )}

              {/* DINNER SECTION */}
              {activeTab === 'dinner' && (
                <div>
                   <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-orange-800 mb-2">🍗 Sugerencias para el Menú (Y algún postre si puede ser Anita🤭🍪)</h3>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        value={newSuggestion}
                        onChange={(e) => setNewSuggestion(e.target.value)}
                        placeholder="Ej: Empanada de pollo y setas por fa"
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-orange-500 outline-none"
                        disabled={isSaving}
                      />
                      <button 
                        onClick={addSuggestion} 
                        disabled={isSaving}
                        className="bg-orange-600 text-white px-4 rounded hover:bg-orange-700 disabled:bg-gray-400"
                      >
                        {isSaving ? '...' : 'Sugerir'}
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

              {/* ADVENT CALENDAR SECTION */}
              {activeTab === 'advent' && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4 italic">Descubre una sorpresa cada día hasta el 22.</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {Array.from({ length: 22 }, (_, i) => i + 1).map((day) => {
                      const unlocked = isDayUnlocked(day);
                      return (
                        <button
                          key={day}
                          onClick={() => handleDayClick(day)}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition-all transform hover:scale-105 shadow-md
                            ${unlocked 
                              ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-red-900 border-2 border-yellow-600 cursor-pointer' 
                              : 'bg-gray-200 text-gray-400 border-2 border-gray-300 cursor-not-allowed grayscale'
                            }`}
                        >
                          <span className={`text-xl md:text-2xl font-bold font-serif ${unlocked ? '' : 'opacity-50'}`}>{day}</span>
                          {!unlocked && <i className="fas fa-lock absolute bottom-2 opacity-50"></i>}
                          {unlocked && <i className="fas fa-star text-xs absolute bottom-2 text-white/50"></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MINIGAMES SECTION */}
              {activeTab === 'minigames' && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Game Column */}
                    <div className="flex-1">
                         {/* PADEL GAME */}
                         <div className="bg-green-100 p-4 rounded-xl border border-green-300 mb-4 animate-fade-in">
                            <h3 className="font-bold text-green-800 text-lg mb-2">Pádel vs Noelia</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Cuenta la leyenda que Noelia nunca ha perdido un partido. +1 punto por gol, si te marcan, pierdes.
                            </p>
                            <PadelGame playerName={userName} />
                         </div>
                    </div>

                    {/* Leaderboard Column */}
                    <div className="lg:w-1/3 bg-white p-4 rounded-xl border border-gray-200 max-h-[60vh] overflow-y-auto shadow-inner">
                         <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2 sticky top-0 bg-white py-2 border-b">
                            <i className="fas fa-trophy text-yellow-500"></i> Clasificación ATP
                         </h3>
                         
                         {/* PADEL LEADERBOARD */}
                         <div className="space-y-2">
                            {padelHighScores.map((entry, index) => (
                                <div key={entry.id} className={`flex items-center justify-between p-2 rounded shadow-sm ${index === 0 ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold w-6 text-center ${index === 0 ? 'text-2xl text-yellow-600' : 'text-gray-500'}`}>
                                            {index === 0 ? '🥇' : index + 1}
                                        </span>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{entry.name}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(entry.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="font-mono font-bold text-green-700 bg-green-100 px-2 py-1 rounded text-xs">
                                        {entry.score} pts
                                    </span>
                                </div>
                            ))}
                            {padelHighScores.length === 0 && <p className="text-center text-gray-400 text-sm">Sin registros.</p>}
                         </div>
                    </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR ADVENT IMAGES */}
      {viewingDay !== null && (
        <div 
            className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-4 animate-fade-in"
            onClick={() => setViewingDay(null)}
        >
            <button className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300">&times;</button>
            <div className="max-w-3xl w-full bg-white p-2 rounded-lg shadow-2xl transform transition-transform scale-100" onClick={e => e.stopPropagation()}>
                <img 
                    src={adventImages[viewingDay]} 
                    alt={`Día ${viewingDay}`}
                    className="w-full h-auto max-h-[80vh] object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Enlace+Roto+☹️';
                      alert("No se pudo cargar la imagen. Asegúrate de que el enlace termina en .jpg o .png y no es una página web.");
                    }}
                />
                <div className="bg-red-700 text-white text-center py-2 mt-2 rounded festive-font text-2xl">
                    Día {viewingDay}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;