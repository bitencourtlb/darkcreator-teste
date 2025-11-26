import { Scene, AspectRatio } from "../types";

// Utilitário para carregar imagem
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Utilitário para carregar áudio
const loadAudio = async (url: string, context: AudioContext): Promise<AudioBuffer> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await context.decodeAudioData(arrayBuffer);
};

// Função para quebrar texto em linhas para a legenda
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  let lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const renderFinalVideo = async (
  scenes: Scene[],
  aspectRatio: AspectRatio,
  withSubtitles: boolean,
  onProgress: (progress: number) => void
): Promise<{ url: string; extension: string }> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  // Configuração da Resolução (1080p)
  if (aspectRatio === AspectRatio.LANDSCAPE) {
    canvas.width = 1920;
    canvas.height = 1080;
  } else {
    canvas.width = 1080;
    canvas.height = 1920;
  }

  if (!ctx) throw new Error("Não foi possível iniciar o contexto 2D");

  // Configuração de Áudio
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioDestination = audioContext.createMediaStreamDestination();
  
  const canvasStream = canvas.captureStream(30); // 30 FPS
  
  // Combina faixas de áudio e vídeo
  const combinedTracks = [
    ...canvasStream.getVideoTracks(),
    ...audioDestination.stream.getAudioTracks()
  ];
  const combinedStream = new MediaStream(combinedTracks);

  // Tenta priorizar MP4 com H.264 para maior compatibilidade
  const mimeTypes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 Baseline (Mais compatível)
    'video/mp4;codecs=h264,aac',
    'video/mp4',
    'video/webm;codecs=vp9,opus', // Fallback alta qualidade
    'video/webm' // Fallback genérico
  ];

  let selectedMimeType = '';
  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      selectedMimeType = type;
      break;
    }
  }

  if (!selectedMimeType) {
    selectedMimeType = 'video/webm'; // Fallback final
  }

  console.log(`Usando codec de vídeo: ${selectedMimeType}`);

  const mediaRecorder = new MediaRecorder(combinedStream, { 
    mimeType: selectedMimeType, 
    videoBitsPerSecond: 8000000 // 8 Mbps para boa qualidade
  });
  
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise(async (resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: selectedMimeType });
      const url = URL.createObjectURL(blob);
      
      // Define a extensão baseada no tipo MIME escolhido
      const extension = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
      
      resolve({ url, extension });
      
      // Cleanup
      audioContext.close();
      canvasStream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();

    // Loop de renderização cena por cena
    try {
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        onProgress((i / scenes.length) * 100);

        if (!scene.imageUrl || !scene.audioUrl) continue;

        const img = await loadImage(scene.imageUrl);
        const audioBuffer = await loadAudio(scene.audioUrl, audioContext);

        // Tocar áudio
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioDestination);
        source.start();

        const duration = audioBuffer.duration;
        const startTime = performance.now();
        
        // Loop de Animação da Cena (Ken Burns + Legendas)
        await new Promise<void>((resolveScene) => {
          const animate = (currentTime: number) => {
             const elapsed = (currentTime - startTime) / 1000;
             
             if (elapsed >= duration) {
               resolveScene();
               return;
             }

             // Limpar
             ctx.fillStyle = "#000";
             ctx.fillRect(0, 0, canvas.width, canvas.height);

             // Calcular Zoom (Ken Burns)
             // Vai de escala 1.0 até 1.15
             const progress = elapsed / duration;
             const scale = 1.0 + (progress * 0.15);
             
             const w = canvas.width;
             const h = canvas.height;
             
             // Zoom centralizado
             const drawW = w * scale;
             const drawH = h * scale;
             const drawX = (w - drawW) / 2;
             const drawY = (h - drawH) / 2;

             ctx.drawImage(img, drawX, drawY, drawW, drawH);

             // Renderizar Legendas
             if (withSubtitles) {
                const fontSize = aspectRatio === AspectRatio.LANDSCAPE ? 60 : 50;
                ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                
                // Sombra da legenda
                ctx.shadowColor = "rgba(0,0,0,0.8)";
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 3;

                const maxWidth = canvas.width * 0.8;
                const lines = wrapText(ctx, scene.scriptText, maxWidth);
                
                const lineHeight = fontSize * 1.3;
                const bottomMargin = canvas.height * 0.1;

                lines.forEach((line, idx) => {
                    // Desenha de baixo para cima
                    const y = canvas.height - bottomMargin - ((lines.length - 1 - idx) * lineHeight);
                    ctx.fillText(line, canvas.width / 2, y);
                });

                // Reset shadow
                ctx.shadowColor = "transparent";
             }

             requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        });
      }
      
      onProgress(100);
      mediaRecorder.stop();

    } catch (err) {
      reject(err);
    }
  });
};