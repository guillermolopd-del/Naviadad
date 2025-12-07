
import React, { useRef, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { ref, push, get, update } from 'firebase/database';

interface PadelGameProps {
  playerName: string;
}

const PadelGame: React.FC<PadelGameProps> = ({ playerName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScoreSubmitted, setHighScoreSubmitted] = useState(false);
  const lastTimeRef = useRef<number>(0);

  // Game Constants
  const PADDLE_HEIGHT = 80;
  const PADDLE_WIDTH = 10;
  const BALL_SIZE = 8;
  const CANVAS_WIDTH = 600; 
  const CANVAS_HEIGHT = 400;
  const INITIAL_SPEED = 4; // Velocidad base
  const TARGET_FPS = 60;

  // Game State Refs (mutable for loop)
  const stateRef = useRef({
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballSpeedX: INITIAL_SPEED,
    ballSpeedY: INITIAL_SPEED,
    playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    computerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    score: 0,
    isPlaying: false
  });

  // Upload Score to Firebase (ONLY HIGHEST SCORE)
  useEffect(() => {
    if (gameState === 'gameover' && !highScoreSubmitted && stateRef.current.score > 0) {
      const saveScore = async () => {
        try {
          const scoresRef = ref(db, 'leaderboard_padel');
          const currentScore = stateRef.current.score;
          
          // 1. Obtener todas las puntuaciones para buscar manualmente (Evita errores de Index en Firebase)
          const snapshot = await get(scoresRef);
          
          let existingKey: string | null = null;
          let oldScore = 0;

          if (snapshot.exists()) {
            const data = snapshot.val();
            // Búsqueda manual en cliente para no requerir reglas de indexación "indexOn": "name"
            for (const key in data) {
                if (data[key].name === playerName) {
                    existingKey = key;
                    oldScore = data[key].score;
                    break;
                }
            }
          }

          if (existingKey) {
            // Ya existe: Comprobar si la nueva puntuación es mejor
            if (currentScore > oldScore) {
                // Actualizar solo si ha mejorado
                await update(ref(db, `leaderboard_padel/${existingKey}`), {
                    score: currentScore,
                    timestamp: Date.now()
                });
                console.log("Récord actualizado!");
            } else {
                console.log("Oh vaya, no has superado tu mejor puntuación.");
            }
          } else {
            // No existe: Crear nuevo registro
            await push(scoresRef, {
                name: playerName,
                score: currentScore,
                timestamp: Date.now()
            });
            console.log("Nueva puntuación registrada!");
          }
          
          setHighScoreSubmitted(true);
        } catch (error) {
          console.error("Error saving score:", error);
          alert("Error al guardar puntuación. Revisa la consola.");
        }
      };
      saveScore();
    }
  }, [gameState, highScoreSubmitted, playerName]);

  // Input Handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleY = CANVAS_HEIGHT / rect.height;
      const relativeY = (e.clientY - rect.top) * scaleY;
      
      // Center paddle on mouse
      stateRef.current.playerY = relativeY - PADDLE_HEIGHT / 2;
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!canvasRef.current) return;
        if(stateRef.current.isPlaying) e.preventDefault();
        
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleY = CANVAS_HEIGHT / rect.height;
        const relativeY = (e.touches[0].clientY - rect.top) * scaleY;
        stateRef.current.playerY = relativeY - PADDLE_HEIGHT / 2;
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, []);

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Calcular factor de ajuste de velocidad (si va lento, mueve más pixeles)
      // Base es 60fps (aprox 16.6ms por frame)
      const timeScale = deltaTime / (1000 / TARGET_FPS);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const state = stateRef.current;

      if (!canvas || !ctx) {
          animationFrameId = requestAnimationFrame(loop);
          return;
      }

      // 1. UPDATE LOGIC
      if (state.isPlaying) {
        // Move Ball (Scaled by Delta Time)
        state.ballX += state.ballSpeedX * timeScale;
        state.ballY += state.ballSpeedY * timeScale;

        // Wall Collisions (Top/Bottom)
        if (state.ballY < 0 || state.ballY > CANVAS_HEIGHT) {
          state.ballSpeedY = -state.ballSpeedY;
        }

        // Paddle Collision (Player - Left)
        if (state.ballX < PADDLE_WIDTH + 5) {
          if (state.ballY > state.playerY && state.ballY < state.playerY + PADDLE_HEIGHT) {
            // Speed up slightly
            const currentSpeed = Math.abs(state.ballSpeedX);
            const newSpeed = currentSpeed + 0.2;
            state.ballSpeedX = newSpeed; 
            
            // Add slight angle variation based on where it hit the paddle
            const deltaY = state.ballY - (state.playerY + PADDLE_HEIGHT / 2);
            state.ballSpeedY = deltaY * 0.2;
          } else if (state.ballX < 0) {
            // GAME OVER - Ball passed player
            setScore(state.score);
            setGameState('gameover');
            state.isPlaying = false;
          }
        }

        // Paddle Collision (Noelia - Right)
        if (state.ballX > CANVAS_WIDTH - PADDLE_WIDTH - 5) {
          if (state.ballY > state.computerY && state.ballY < state.computerY + PADDLE_HEIGHT) {
             state.ballSpeedX = -Math.abs(state.ballSpeedX) - 0.2; // Bounce back
          } else if (state.ballX > CANVAS_WIDTH) {
             // SCORE - Player scored against Noelia
             state.score += 1;
             setScore(state.score);
             // Reset Ball
             state.ballX = CANVAS_WIDTH / 2;
             state.ballY = CANVAS_HEIGHT / 2;
             // RESET SPEED TO INITIAL (Slower)
             state.ballSpeedX = -INITIAL_SPEED; 
             state.ballSpeedY = (Math.random() * 4) - 2;
          }
        }

        // AI Logic (Noelia) - Scaled by Delta Time
        const centerPaddle = state.computerY + PADDLE_HEIGHT / 2;
        
        // MODIFICACIÓN DE DIFICULTAD:
        // 1. Velocidad base reducida de 3.5 a 2.5 (Más lenta que la bola inicial)
        // 2. Progresión reducida de 0.1 a 0.05 por nivel
        const aiSpeed = (2.5 + (state.score * 0.05)) * timeScale; 

        // Solo se mueve si la pelota va hacia ella
        if (state.ballSpeedX > 0) {
            // 3. RETRASO EN REACCIÓN: Solo empieza a moverse si la pelota ha pasado x=50
            if (state.ballX > 50) {
                // 4. MARGEN DE ERROR: Aumentado de 10 a 25. Es menos precisa y "vaga"
                if (centerPaddle < state.ballY - 25) {
                    state.computerY += aiSpeed;
                } else if (centerPaddle > state.ballY + 25) {
                    state.computerY -= aiSpeed;
                }
            }
        }
      }

      // Keep paddles in bounds
      state.playerY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.playerY));
      state.computerY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.computerY));


      // 2. DRAW LOGIC
      // Background (Padel Court Green)
      ctx.fillStyle = '#2e8b57';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Court Lines
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();

      // Paddles
      ctx.fillStyle = '#ef4444'; // Player Red
      ctx.fillRect(0, state.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
      
      ctx.fillStyle = '#facc15'; // Noelia Yellow
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, state.computerY, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Ball
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, BALL_SIZE, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; // White ball
      ctx.fill();
      ctx.closePath();

      // Names
      ctx.font = '14px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(playerName, 10, 20);
      ctx.fillText("Noelia Prime", CANVAS_WIDTH - 80, 20);
      
      // Score in background
      if (state.isPlaying) {
          ctx.font = 'bold 40px Arial';
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.textAlign = 'center';
          ctx.fillText(state.score.toString(), CANVAS_WIDTH / 2, 50);
          ctx.textAlign = 'start';
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const startGame = () => {
    stateRef.current = {
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballSpeedX: INITIAL_SPEED,
      ballSpeedY: (Math.random() * 4) - 2,
      playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      computerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      score: 0,
      isPlaying: true
    };
    lastTimeRef.current = 0;
    setScore(0);
    setHighScoreSubmitted(false);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-white/20">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT}
          className="w-full max-w-full h-auto bg-green-700 cursor-none touch-none"
          style={{ maxHeight: '60vh' }}
        />

        {/* OVERLAY: MENU */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4 text-center">
            <h3 className="text-3xl font-bold mb-2 text-yellow-300">Pádel vs Noelia</h3>
            <p className="mb-6 text-sm max-w-xs">Usa el ratón o el dedo para mover la pala roja. Marca puntos para subir en el ranking. Si Noelia marca, pierdes.</p>
            <button 
              onClick={startGame}
              className="px-8 py-3 bg-red-600 rounded-full font-bold hover:bg-red-500 hover:scale-105 transition-all"
            >
              ¡JUGAR! 🎾
            </button>
          </div>
        )}

        {/* OVERLAY: GAME OVER */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center text-white p-4">
            <h3 className="text-4xl font-bold mb-2">¡PUNTO PARA NOELIA!</h3>
            <p className="text-xl mb-4">Tu Puntuación: <span className="text-yellow-300 font-bold text-3xl">{score}</span></p>
            {highScoreSubmitted && <p className="text-green-300 text-sm mb-6">✅ Puntuación guardada</p>}
            <button 
              onClick={startGame}
              className="px-8 py-3 bg-white text-red-900 rounded-full font-bold hover:bg-gray-200 transition-all"
            >
              Revancha
            </button>
          </div>
        )}
      </div>
      <p className="text-gray-400 text-xs mt-2">Mueve el ratón o el dedo verticalmente para controlar la pala roja.</p>
    </div>
  );
};

export default PadelGame;
