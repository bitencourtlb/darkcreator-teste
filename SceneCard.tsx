import React, { useState, useRef } from 'react';
import { Scene, AspectRatio } from '../types';
import { RefreshCw, Loader2, ImageIcon, Download, Edit2, X, Upload, Volume2, Mic } from './Icons';

interface SceneCardProps {
  scene: Scene;
  index: number;
  aspectRatio: AspectRatio;
  onRegenerateImage: (id: string) => void;
  onEditImage: (id: string, prompt: string) => void;
  onGenerateAudio: (id: string) => void;
  onUploadImage: (id: string, file: File) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ 
  scene, index, aspectRatio, 
  onRegenerateImage, onEditImage, onGenerateAudio, onUploadImage 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadImage = () => {
    if (scene.imageUrl) {
        const link = document.createElement('a');
        link.href = scene.imageUrl;
        link.download = `cena-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg flex flex-col md:flex-row animate-in">
      {/* Left: Script and Controls */}
      <div className="p-6 md:w-1/3 flex flex-col gap-4 border-b md:border-r border-slate-700">
        <div className="flex items-center justify-between">
           <div className="text-yellow-400 font-bold text-xs uppercase tracking-wider">Cena {index + 1}</div>
        </div>
        
        <p className="text-slate-200 font-medium text-lg leading-relaxed">"{scene.scriptText}"</p>
        
        <div className="bg-slate-900/50 p-3 rounded text-xs text-slate-400 italic border border-slate-800">
          Prompt Visual: {scene.visualPrompt}
        </div>

        <div className="bg-slate-900/30 p-3 rounded border border-slate-700/50 mt-2">
            {scene.audioUrl ? (
                <div className="gap-2 flex flex-col">
                    <div className="text-yellow-300 text-xs font-bold flex items-center gap-1">
                        <Volume2 className="w-3 h-3"/> Narração Gerada
                    </div>
                    <audio controls src={scene.audioUrl} className="w-full h-8" />
                </div>
            ) : (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                    {scene.isGeneratingAudio ? <Loader2 className="w-3 h-3 animate-spin"/> : <Mic className="w-3 h-3"/>}
                    {scene.isGeneratingAudio ? "Gerando áudio..." : "Aguardando geração de áudio"}
                </div>
            )}
        </div>

        <div className="mt-auto pt-4 flex gap-2 flex-wrap border-t border-slate-700/50">
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onUploadImage(scene.id, e.target.files[0])}
            />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors">
                <Upload className="w-3 h-3"/> Ref
            </button>
            <button 
                onClick={() => onRegenerateImage(scene.id)}
                disabled={scene.isGeneratingImage}
                className="flex items-center gap-1 px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors disabled:opacity-50"
            >
                <RefreshCw className={`w-3 h-3 ${scene.isGeneratingImage ? 'animate-spin' : ''}`}/> Regerar
            </button>
        </div>
      </div>

      {/* Right: Visual Preview */}
      <div className="flex-1 p-6 bg-slate-900/30 flex flex-col items-center justify-center gap-4 relative">
        <div className={`relative w-full ${aspectRatio === AspectRatio.LANDSCAPE ? 'aspect-video' : 'aspect-[9/16] max-w-[300px]'} bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center group`}>
          
          {scene.isGeneratingImage ? (
            <div className="text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500"/>
              <span className="text-sm font-medium text-yellow-500/80 animate-pulse">Criando ilustração...</span>
            </div>
          ) : scene.imageUrl ? (
            <img src={scene.imageUrl} className="w-full h-full object-cover" alt="Scene generation" />
          ) : (
            <div className="text-slate-600 flex flex-col items-center gap-2">
              <ImageIcon className="w-10 h-10 opacity-50"/>
              <span className="text-sm">Aguardando geração</span>
            </div>
          )}

          {scene.error && (
            <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center text-red-200 text-xs p-4 text-center backdrop-blur-sm">
              {scene.error}
            </div>
          )}
        </div>

        {/* Actions Bar */}
        {scene.imageUrl && !scene.isGeneratingImage && (
          <div className="flex gap-2 bg-slate-800/80 backdrop-blur p-2 rounded-full border border-slate-700 shadow-xl">
            {isEditing ? (
                <div className="flex gap-2 items-center px-2">
                    <input 
                        type="text" 
                        value={editPrompt} 
                        onChange={e => setEditPrompt(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white text-xs rounded px-2 py-1 outline-none focus:ring-1 ring-yellow-500"
                        placeholder="Ex: Adicionar chuva..."
                    />
                    <button onClick={() => { onEditImage(scene.id, editPrompt); setIsEditing(false); }} className="bg-green-600 hover:bg-green-500 text-white p-1 rounded transition-colors">
                        <RefreshCw className="w-4 h-4"/>
                    </button>
                    <button onClick={() => setIsEditing(false)} className="bg-slate-600 hover:bg-slate-500 text-white p-1 rounded transition-colors">
                        <X className="w-4 h-4"/>
                    </button>
                </div>
            ) : (
                <>
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-colors">
                        <Edit2 className="w-3 h-3"/> Editar
                    </button>
                    <button onClick={handleDownloadImage} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-colors" title="Baixar Imagem">
                        <Download className="w-3 h-3"/>
                    </button>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneCard;