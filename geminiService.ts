import { GoogleGenAI, Type } from "@google/genai";
import { AspectRatio, VoiceName } from "../types";

const getClient = () => {
  let apiKey = "";

  // 1. Tenta pegar do process.env (Node/Webpack/AI Studio) de forma segura
  try {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
        apiKey = process.env.API_KEY;
    }
  } catch(e) {}

  // 2. Se falhar, tenta pegar do Vite (import.meta.env) - Padrão Vercel/Frontend
  if (!apiKey) {
     try {
        // @ts-ignore
        apiKey = import.meta.env?.VITE_API_KEY || "";
     } catch(e) {}
  }

  if (!apiKey) {
    throw new Error("API Key não encontrada. Na Vercel, renomeie sua variável de ambiente para 'VITE_API_KEY'.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- GERAÇÃO DE ROTEIRO (Mantém Gemini - Baixo consumo de cota) ---

export const analyzeScript = async (script: string) => {
  const ai = getClient();
  const prompt = `
    Analise o seguinte roteiro de vídeo. Divida-o em cenas visuais lógicas (segmentos).
    Para cada cena, forneça o segmento de texto original e uma descrição visual altamente detalhada e criativa adequada para um gerador de imagem de IA (em inglês para melhor qualidade).
    Concentre-se na iluminação, composição, estilo cinematográfico e clima.
    
    Script:
    "${script}"
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                visual_description: { type: Type.STRING }
              },
              required: ["text", "visual_description"]
            }
          }
        }
      }
    }
  });

  let text = response.text;
  if (!text) throw new Error("Sem resposta do Gemini");
  
  try {
      text = text.replace(/```json\n?|```/g, '').trim();
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
          text = text.substring(startIndex, endIndex + 1);
      }
      return JSON.parse(text);
  } catch (e) {
      console.error("Erro ao fazer parse do JSON:", text);
      throw new Error(`Falha ao ler resposta da IA.`);
  }
};

// --- GERAÇÃO DE IMAGEM (FLUX VIA POLLINATIONS) - SEM COTA GOOGLE ---

const generateWithPollinations = async (prompt: string, aspectRatio: AspectRatio) => {
    // Definição de dimensões baseadas na proporção
    const width = aspectRatio === AspectRatio.LANDSCAPE ? 1280 : 720;
    const height = aspectRatio === AspectRatio.LANDSCAPE ? 720 : 1280;
    
    // Seed aleatória para garantir variedade
    const seed = Math.floor(Math.random() * 10000000);
    
    // Melhora o prompt automaticamente para estilo cinematográfico se não estiver explícito
    const enhancedPrompt = encodeURIComponent(`${prompt}, cinematic lighting, highly detailed, 8k, photorealistic`);
    
    // URL da API do Pollinations usando o modelo FLUX
    const imageUrl = `https://pollinations.ai/p/${enhancedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`;

    try {
        // Faz o fetch da imagem para garantir que ela existe e criar um Blob local.
        // Isso evita problemas de CORS (Cross-Origin) ao desenhar no Canvas do vídeo depois.
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("Falha ao conectar com servidor de imagem Flux");
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e: any) {
        console.error("Erro Flux Pollinations:", e);
        throw new Error("Erro ao gerar imagem Flux. Tente novamente.");
    }
};

export const generateSceneImage = async (visualPrompt: string, aspectRatio: AspectRatio) => {
    // Usa Flux em vez de Gemini Image
    return await generateWithPollinations(visualPrompt, aspectRatio);
};

export const editSceneImage = async (base64Image: string, editInstruction: string, aspectRatio: AspectRatio) => {
    // Como o Flux via API simples é Txt2Img, tratamos a edição como uma regeneração com o novo prompt.
    // Isso é mais robusto e não consome cota de edição de imagem do Google.
    return await generateWithPollinations(editInstruction, aspectRatio);
};

// --- GERAÇÃO DE ÁUDIO (Mantém Gemini TTS) ---

const createWavHeader = (dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number) => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    return new Uint8Array(header);
};

const pcmToWavUrl = (base64Pcm: string, sampleRate = 24000) => {
    const binaryString = atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

    const header = createWavHeader(bytes.length, sampleRate, 1, 16);
    const wavBytes = new Uint8Array(header.length + bytes.length);
    wavBytes.set(header);
    wavBytes.set(bytes, header.length);

    const blob = new Blob([wavBytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
};

export const generateSceneAudio = async (text: string, voiceName: VoiceName = 'Kore') => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text: text }] },
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
            }
        }
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Nenhum áudio retornado");
    
    return pcmToWavUrl(base64Audio, 24000);
};