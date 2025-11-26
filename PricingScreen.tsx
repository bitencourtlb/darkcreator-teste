import React from 'react';
import { Wand2, CheckCircle, CreditCard } from './Icons';

interface PricingScreenProps {
    onBackToLogin?: () => void;
}

const PricingScreen: React.FC<PricingScreenProps> = ({ onBackToLogin }) => {

  const handleSubscribe = () => {
    window.open("https://pay.kiwify.com.br/uZUHP57", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4 relative font-sans">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-blue-900/10 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center z-10">
            {/* Left Content */}
            <div className="space-y-8">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
                    Liberte sua <br/>
                    criatividade <span className="text-yellow-400">Sem <br/> Limites</span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed max-w-lg">
                    Faça upgrade para o Dark Creator Pass e acesse as ferramentas de IA mais avançadas do mercado.
                </p>
                
                <div className="space-y-4 pt-2">
                    {[
                        "Geração Ilimitada de Imagens",
                        "Vozes Neurais Ultra-realistas",
                        "Sem marca d'água",
                        "Prioridade no processamento",
                        "Suporte Premium"
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                            <span className="text-slate-200 font-medium text-lg">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-[#0F172A] rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
                <div className="flex justify-between items-start mb-8">
                    <span className="bg-slate-800/80 border border-yellow-600/30 text-yellow-500 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
                        Creator Pass
                    </span>
                    <Wand2 className="w-6 h-6 text-yellow-500" />
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-sm text-slate-400 font-medium">R$</span>
                    <span className="text-6xl font-bold text-white tracking-tighter">19,90</span>
                    <span className="text-slate-400 text-lg">/mês</span>
                </div>
                <p className="text-slate-500 text-sm mb-8">Cancele quando quiser.</p>

                <button 
                    onClick={handleSubscribe}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-lg py-4 rounded-lg shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                >
                    Assinar Agora <CreditCard className="w-5 h-5" />
                </button>
                
                <div className="mt-6 text-center">
                    <button 
                        onClick={onBackToLogin}
                        className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
                    >
                        Já fiz o pagamento
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PricingScreen;