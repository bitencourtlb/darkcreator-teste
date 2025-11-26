import React, { useState, useEffect } from 'react';
import { Wand2, LogOut, Loader2, Download, Play, CheckCircle, X, CreditCard } from './components/Icons';
import { AspectRatio, Scene, VoiceName } from './types';
import { analyzeScript, generateSceneImage, editSceneImage, generateSceneAudio } from './services/geminiService';
import { renderFinalVideo } from './services/renderService';
import { dbService } from './services/dbService';
import SceneCard from './components/SceneCard';
import LoginScreen from './components/LoginScreen';
import PricingScreen from './components/PricingScreen';
import AdminDashboard from './components/AdminDashboard';

const AVAILABLE_VOICES: VoiceName[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

function App() {
  const [currentView, setCurrentView] = useState<'login' | 'app' | 'pricing' | 'admin'>('login');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [hasApiKey, setHasApiKey] = useState(false);
  
  // Video Rendering States
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderingProgress, setRenderingProgress] = useState(0);
  const [withSubtitles, setWithSubtitles] = useState(true);
  const [generatedVideo, setGeneratedVideo] = useState<{ url: string, extension: string } | null>(null);

  // Check for Gemini API Key (Supports AI Studio, Process Env, and Vite Env)
  useEffect(() => {
    const checkKey = async () => {
        // 1. Check AI Studio Internal Tool
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (hasKey) {
                setHasApiKey(true);
                return;
            }
        }
        
        // 2. Check Standard Process Env (Node/Webpack)
        if (typeof process !== 'undefined' && process.env?.API_KEY) {
            setHasApiKey(true);
            return;
        }

        // 3. Check Vite Env
        try {
            // @ts-ignore
            if (import.meta.env?.VITE_API_KEY) {
                setHasApiKey(true);
                return;
            }
        } catch(e) {}

        setHasApiKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
        try {
            await window.aistudio.openSelectKey();
        } catch (e) {
            console.error(e);
        }
        // Force update state assuming success to handle race condition as per guidelines
        setHasApiKey(true);
    }
  };

  const handleLogin = (email: string) => {
    setUserEmail(email);
    
    // Admin Check
    if (email.toLowerCase() === 'admin@darkcreator.ai' || email.toLowerCase() === 'lucasbitencourt2518@gmail.com') {
        setCurrentView('admin');
        return;
    }

    // Subscription Check
    const isSubscribed = dbService.checkSubscription(email);
    if (isSubscribed) {
        setCurrentView('app');
    } else {
        setCurrentView('pricing');
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) return;
    
    setIsAnalyzing(true);
    setScenes([]);

    try {
      const analysis = await analyzeScript(script);
      
      const newScenes: Scene[] = analysis.scenes.map((s: any, i: number) => ({
        id: `scene-${Date.now()}-${i}`,
        scriptText: s.text,
        visualPrompt: s.visual_description,
        isGeneratingImage: true,
        isGeneratingAudio: true
      }));

      setScenes(newScenes);
      setIsAnalyzing(false);

      // Parallel Generation: Images AND Audio
      newScenes.forEach(scene => {
        // Image Generation
        generateSceneImage(scene.visualPrompt, aspectRatio)
          .then(url => {
            setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, imageUrl: url, isGeneratingImage: false } : s));
          })
          .catch(err => {
            console.error("Erro imagem:", err);
            // Extrai mensagem útil
            const errorMsg = err.message || "Erro desconhecido";
            setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, isGeneratingImage: false, error: errorMsg } : s));
          });

        // Audio Generation
        generateSceneAudio(scene.scriptText, selectedVoice)
           .then(url => {
               setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, audioUrl: url, isGeneratingAudio: false } : s));
           })
           .catch(err => {
               console.error("Erro áudio:", err);
               setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, isGeneratingAudio: false, error: "Erro audio" } : s));
           });
      });

    } catch (error: any) {
      console.error(error);
      setIsAnalyzing(false);
      
      let errorMessage = error.message || "Erro desconhecido";
      
      // Tratamento específico para API Desativada
      if (errorMessage.includes("Generative Language API") || errorMessage.includes("SERVICE_DISABLED")) {
          alert(
              "ERRO: API Não Habilitada.\n\n" +
              "A 'Generative Language API' não está ativada no seu projeto do Google Cloud.\n\n" +
              "Solução: Vá ao console do Google Cloud, selecione seu projeto e ative a API 'Generative Language API'."
          );
          return;
      }
      
      // Tenta limpar JSON bruto se houver (SDK as vezes retorna o erro como JSON string)
      if (errorMessage.includes('{"error":')) {
           try {
               const foundJson = errorMessage.match(/\{.*\}/);
               if (foundJson) {
                   const parsed = JSON.parse(foundJson[0]);
                   if (parsed.error?.message) {
                       errorMessage = parsed.error.message;
                   }
               }
           } catch(e) {}
      }

      alert(`Erro ao analisar roteiro: ${errorMessage}`);
    }
  };

  const handleRenderFinalVideo = async () => {
      const readyScenes = scenes.filter(s => s.imageUrl && s.audioUrl);
      if (readyScenes.length === 0) return;

      setIsRenderingVideo(true);
      setRenderingProgress(0);

      try {
          const result = await renderFinalVideo(readyScenes, aspectRatio, withSubtitles, (progress) => {
              setRenderingProgress(progress);
          });
          
          setGeneratedVideo(result);

      } catch (e) {
          console.error(e);
          alert("Erro ao renderizar vídeo final.");
      } finally {
          setIsRenderingVideo(false);
          setRenderingProgress(0);
      }
  };

  const downloadVideo = () => {
      if (!generatedVideo) return;
      
      const link = document.createElement('a');
      link.href = generatedVideo.url;
      link.download = `dark_creator_video_${Date.now()}.${generatedVideo.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const closePreview = () => {
      setGeneratedVideo(null);
  };

  const allAssetsReady = scenes.length > 0 && scenes.every(s => !s.isGeneratingImage && !s.isGeneratingAudio && s.imageUrl && s.audioUrl);

  // Render Views
  if (currentView === 'login') return <LoginScreen onLogin={handleLogin} onNavigateToPricing={() => setCurrentView('pricing')} />;
  if (currentView === 'pricing') return <PricingScreen onBackToLogin={() => setCurrentView('login')} />;
  if (currentView === 'admin') return <AdminDashboard onLogout={() => setCurrentView('login')} />;

  // Main App View
  return (
    <div className="min-h-screen bg-slate-900 pb-20 relative">
      
      {/* Video Preview Modal */}
      {generatedVideo && (
          <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                      <h3 className="text-white font-bold flex items-center gap-2">
                          <Play className="w-5 h-5 text-green-500"/> Preview do Vídeo
                      </h3>
                      <button onClick={closePreview} className="text-slate-400 hover:text-white transition-colors">
                          <X className="w-6 h-6"/>
                      </button>
                  </div>
                  
                  <div className="p-4 bg-black flex justify-center items-center">
                      <video 
                        src={generatedVideo.url} 
                        controls 
                        autoPlay
                        className="max-h-[70vh] rounded-lg shadow-lg border border-slate-800"
                        style={{ aspectRatio: aspectRatio === AspectRatio.LANDSCAPE ? '16/9' : '9/16' }}
                      />
                  </div>

                  <div className="p-6 bg-slate-900 flex justify-between items-center border-t border-slate-800 gap-4">
                      <span className="text-slate-400 text-sm">
                          Formato: <span className="text-yellow-500 font-mono uppercase">{generatedVideo.extension}</span>
                      </span>
                      <div className="flex gap-3">
                          <button 
                             onClick={closePreview}
                             className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium"
                          >
                             Fechar
                          </button>
                          <button 
                             onClick={downloadVideo}
                             className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 transform hover:scale-105 transition-all"
                          >
                             <Download className="w-5 h-5"/> Baixar Vídeo
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-amber-400">
          <Wand2 /> Dark Creator AI
        </div>
        <div className="flex gap-4 items-center">
           <button onClick={() => setCurrentView('login')} className="text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
           </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-8">
        
        {/* Description Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
             <h2 className="text-2xl font-bold text-white mb-2">Editor de Vídeo IA</h2>
             <p className="text-slate-300">
                Transforme textos em vídeos narrados com efeito cinematográfico (zoom dinâmico) e legendas automáticas. 
                A IA analisa seu roteiro, cria ilustrações para cada cena, gera a narração e compila tudo em um arquivo MP4 pronto para uso.
             </p>
        </div>

        {/* API Key Check / Warning */}
        {!hasApiKey && (
             <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                 <div className="flex items-center gap-3">
                     <div className="bg-yellow-500/10 p-2 rounded-lg">
                         <CreditCard className="w-6 h-6 text-yellow-500" />
                     </div>
                     <div>
                         <h3 className="font-bold text-white">Chave de API Necessária</h3>
                         <p className="text-slate-400 text-sm">
                            {window.aistudio ? 
                                "Para gerar vídeos, selecione um projeto pago no Google AI Studio." : 
                                "API Key não detectada. Se estiver na Vercel, certifique-se de configurar a variável de ambiente VITE_API_KEY."
                            }
                         </p>
                     </div>
                 </div>
                 {window.aistudio && (
                     <button 
                         onClick={handleSelectKey}
                         className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                     >
                         Selecionar API Key
                     </button>
                 )}
             </div>
        )}

        {/* Input Section */}
        <section className="space-y-4">
          <textarea 
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full h-40 bg-slate-800 rounded-xl border border-slate-700 p-4 text-slate-200 focus:ring-2 ring-yellow-500 outline-none resize-none shadow-inner placeholder-slate-500"
            placeholder="Cole seu roteiro aqui para começar a mágica..."
          />
          
          <div className="flex gap-4 flex-wrap bg-slate-800 p-4 rounded-xl border border-slate-700 items-center shadow-lg">
             <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button 
                    onClick={() => setAspectRatio(AspectRatio.LANDSCAPE)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${aspectRatio === AspectRatio.LANDSCAPE ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    16:9
                </button>
                <button 
                    onClick={() => setAspectRatio(AspectRatio.PORTRAIT)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${aspectRatio === AspectRatio.PORTRAIT ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    9:16
                </button>
             </div>

             <select 
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
                className="bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500"
             >
                {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
             </select>

             <button 
                onClick={handleGenerate}
                disabled={isAnalyzing || !script || !hasApiKey}
                className="ml-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-900 px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-yellow-500/20"
                title={!hasApiKey ? "API Key Necessária" : "Gerar"}
             >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Wand2 />}
                Gerar Cenas
             </button>
          </div>
        </section>

        {/* Final Video Action Bar */}
        {scenes.length > 0 && (
            <div className={`sticky top-20 z-40 bg-slate-800/90 backdrop-blur p-4 rounded-xl border border-slate-600 shadow-2xl flex items-center justify-between transition-all ${allAssetsReady ? 'opacity-100 translate-y-0' : 'opacity-80'}`}>
                <div className="flex items-center gap-4">
                    <div className="text-white font-bold flex items-center gap-2">
                        {allAssetsReady ? <CheckCircle className="text-green-500"/> : <Loader2 className="animate-spin text-yellow-500"/>}
                        {allAssetsReady ? "Pronto para Renderizar" : "Gerando Assets..."}
                    </div>
                    
                    <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer select-none bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                        <input 
                            type="checkbox" 
                            checked={withSubtitles}
                            onChange={e => setWithSubtitles(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 text-yellow-600 focus:ring-yellow-500"
                        />
                        Incluir Legendas
                    </label>
                </div>

                <button
                    onClick={handleRenderFinalVideo}
                    disabled={!allAssetsReady || isRenderingVideo}
                    className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                    {isRenderingVideo ? (
                        <>
                            <Loader2 className="animate-spin"/> Renderizando {Math.round(renderingProgress)}%
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5"/> Renderizar Vídeo Final
                        </>
                    )}
                </button>
            </div>
        )}

        {/* Scenes Grid */}
        <section className="space-y-6">
            {scenes.length > 0 && (
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">
                    <div className="h-px bg-slate-700 flex-1"/>
                    Preview das Cenas
                    <div className="h-px bg-slate-700 flex-1"/>
                </div>
            )}
            
            {scenes.map((scene, idx) => (
                <SceneCard 
                    key={scene.id}
                    scene={scene}
                    index={idx}
                    aspectRatio={aspectRatio}
                    onRegenerateImage={() => {
                        setScenes(p => p.map(s => s.id === scene.id ? { ...s, isGeneratingImage: true } : s));
                        generateSceneImage(scene.visualPrompt, aspectRatio)
                            .then(url => setScenes(p => p.map(s => s.id === scene.id ? { ...s, imageUrl: url, isGeneratingImage: false } : s)))
                            .catch(e => setScenes(p => p.map(s => s.id === scene.id ? { ...s, isGeneratingImage: false, error: e.message } : s)));
                    }}
                    onEditImage={(id, prompt) => {
                         setScenes(p => p.map(s => s.id === id ? { ...s, isGeneratingImage: true } : s));
                         editSceneImage(scene.imageUrl!, prompt, aspectRatio)
                            .then(url => setScenes(p => p.map(s => s.id === id ? { ...s, imageUrl: url, isGeneratingImage: false } : s)));
                    }}
                    onGenerateAudio={(id) => {
                        setScenes(p => p.map(s => s.id === id ? { ...s, isGeneratingAudio: true } : s));
                        generateSceneAudio(scene.scriptText, selectedVoice)
                            .then(url => setScenes(p => p.map(s => s.id === id ? { ...s, audioUrl: url, isGeneratingAudio: false } : s)));
                    }}
                    onUploadImage={(id, file) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            if (e.target?.result) {
                                setScenes(p => p.map(s => s.id === id ? { ...s, imageUrl: e.target!.result as string } : s));
                            }
                        };
                        reader.readAsDataURL(file);
                    }}
                />
            ))}
        </section>

      </main>
    </div>
  );
}

export default App;