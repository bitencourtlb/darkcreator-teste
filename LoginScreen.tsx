import React, { useState } from 'react';
import { Wand2, Loader2, ArrowRight, ShieldCheck, CreditCard, Lock } from './Icons';
import { dbService } from '../services/dbService';

interface LoginScreenProps {
  onLogin: (email: string) => void;
  onNavigateToPricing: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToPricing }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIsAdmin = (emailStr: string) => {
      const normalized = emailStr.trim().toLowerCase();
      return normalized === 'admin@darkcreator.ai' || normalized === 'lucasbitencourt2518@gmail.com';
  };

  const isAdmin = checkIsAdmin(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setIsLoading(true);

    // Simular delay de verificação
    setTimeout(() => {
      const normalizedEmail = email.trim().toLowerCase();
      
      // 1. Verificação de Admin
      if (checkIsAdmin(normalizedEmail)) {
          if (password !== 'Lbls1271@') {
              setError("Senha de administrador incorreta.");
              setIsLoading(false);
              return;
          }
      } 
      // 2. Verificação de Usuário Comum
      else {
          const defaultUserPassword = dbService.getDefaultPassword();
          if (password !== defaultUserPassword) {
              setError("Senha incorreta.");
              setIsLoading(false);
              return;
          }
      }

      // Se passou pela senha, prossegue para o App (que verificará a assinatura)
      setIsLoading(false);
      onLogin(normalizedEmail); 
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[0%] w-[40%] h-[40%] bg-purple-900/20 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 z-10 flex flex-col gap-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative group">
            <Wand2 className="w-8 h-8 text-slate-900" />
            {isAdmin && (
                <div className="absolute -top-2 -right-2 bg-indigo-600 rounded-full p-1 shadow-md animate-bounce">
                    <ShieldCheck className="w-4 h-4 text-white" />
                </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Dark Creator AI</h1>
          <p className="text-slate-400 text-sm">Entre para começar a criar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex justify-between">
                Email
                {isAdmin && <span className="text-indigo-400 font-bold text-[10px]">MODO ADMIN</span>}
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-slate-950 border ${isAdmin ? 'border-indigo-500/50 focus:ring-indigo-500' : 'border-slate-700 focus:ring-yellow-500'} text-white rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all`}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Senha</label>
            <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-yellow-500 outline-none transition-all pr-10"
                  placeholder="••••••••"
                />
                <Lock className="absolute right-3 top-3.5 w-4 h-4 text-slate-600"/>
            </div>
            {!isAdmin && (
                <p className="text-[10px] text-slate-500 text-right">
                    Esqueceu a senha padrão? Contate o suporte.
                </p>
            )}
          </div>

          {error && (
              <div className="bg-red-900/20 border border-red-900/50 text-red-400 text-xs p-3 rounded-lg text-center font-medium animate-in fade-in slide-in-from-top-2">
                  {error}
              </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 text-slate-900 font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="pt-6 border-t border-slate-800 w-full text-center">
          <p className="text-slate-500 text-xs font-bold tracking-widest mb-4">AINDA NÃO É MEMBRO?</p>
          <button 
            onClick={onNavigateToPricing}
            className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group"
          >
             <CreditCard className="w-4 h-4 text-slate-500 group-hover:text-yellow-500 transition-colors"/>
             Assinar Creator Pass
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;