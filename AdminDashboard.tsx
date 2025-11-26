import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Subscriber } from '../types';
import { 
    LayoutDashboard, Users, Settings, LogOut, Wand2, 
    DollarSign, Activity, Trash2, Plus, Calendar, UserPlus,
    CheckCircle, Lock, Database
} from './Icons';

interface AdminDashboardProps {
    onLogout: () => void;
}

type Tab = 'dashboard' | 'access' | 'settings';
type DurationOption = '1_month' | '3_months' | '6_months' | '1_year' | 'lifetime';
type AccessMode = 'individual' | 'bulk';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    
    // Access Form States
    const [accessMode, setAccessMode] = useState<AccessMode>('individual');
    const [newUserEmail, setNewUserEmail] = useState("");
    const [bulkEmails, setBulkEmails] = useState("");
    const [selectedDuration, setSelectedDuration] = useState<DurationOption>('1_month');
    
    // Settings States
    const [defaultPassword, setDefaultPassword] = useState("");
    const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

    useEffect(() => {
        refreshList();
        setDefaultPassword(dbService.getDefaultPassword());
    }, []);

    const refreshList = () => {
        setSubscribers(dbService.getAllSubscribers());
    };

    const handleAddUser = () => {
        if (accessMode === 'individual') {
            if (!newUserEmail) return;
            processAddUser([newUserEmail]);
            setNewUserEmail("");
        } else {
            if (!bulkEmails) return;
            // Separa por nova linha ou vírgula
            const emails = bulkEmails.split(/[\n,]+/).map(e => e.trim()).filter(e => e.includes('@'));
            processAddUser(emails);
            setBulkEmails("");
        }
    };

    const processAddUser = (emails: string[]) => {
        let months = 1;
        switch (selectedDuration) {
            case '1_month': months = 1; break;
            case '3_months': months = 3; break;
            case '6_months': months = 6; break;
            case '1_year': months = 12; break;
            case 'lifetime': months = 1200; break; // 100 anos (Vitalício)
        }

        let count = 0;
        emails.forEach(email => {
            if (email) {
                dbService.addManualSubscriber(email, months);
                count++;
            }
        });

        refreshList();
        const durationText = selectedDuration === 'lifetime' ? 'Vitalício' : `${months} meses`;
        alert(`${count} acesso(s) liberado(s). Duração: ${durationText}`);
    };

    const handleUpdatePassword = () => {
        if (!defaultPassword) return;
        dbService.setDefaultPassword(defaultPassword);
        setShowPasswordSuccess(true);
        setTimeout(() => setShowPasswordSuccess(false), 3000);
    };

    const activeCount = subscribers.filter(s => s.status === 'active').length;
    // MRR Simulado (Valor base * ativos)
    const mrr = activeCount * 49.90;

    return (
        <div className="min-h-screen bg-slate-950 flex font-sans text-slate-200">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-800 flex items-center gap-2 font-bold text-white">
                    <Wand2 className="text-yellow-500 w-5 h-5"/> Admin Panel
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('access')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'access' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Users className="w-4 h-4" /> Acessos
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Settings className="w-4 h-4" /> Configurações
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded transition-colors text-sm">
                        <LogOut className="w-4 h-4" /> Sair
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-slate-950 p-8">
                
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in">
                        <h2 className="text-2xl font-bold text-white">Visão Geral</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-slate-400 text-sm">Assinantes Ativos</p>
                                        <h3 className="text-3xl font-bold text-white mt-1">{activeCount}</h3>
                                    </div>
                                    <div className="bg-indigo-500/10 p-2 rounded-lg">
                                        <Users className="w-6 h-6 text-indigo-400" />
                                    </div>
                                </div>
                                <div className="text-xs text-green-400 flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> Base atualizada
                                </div>
                            </div>

                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-slate-400 text-sm">Receita Estimada (MRR)</p>
                                        <h3 className="text-3xl font-bold text-white mt-1">R$ {mrr.toFixed(2)}</h3>
                                    </div>
                                    <div className="bg-green-500/10 p-2 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-400" />
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500">Baseado em assinaturas ativas</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'access' && (
                    <div className="space-y-8 animate-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Gerenciar Acessos</h2>
                        </div>

                        {/* Add User Tool */}
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-2 text-lg font-bold text-white">
                                    <UserPlus className="w-5 h-5 text-green-400"/> Liberar Acesso
                                </div>
                                <div className="h-6 w-px bg-slate-700 mx-2"></div>
                                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                                    <button 
                                        onClick={() => setAccessMode('individual')}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${accessMode === 'individual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Individual
                                    </button>
                                    <button 
                                        onClick={() => setAccessMode('bulk')}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${accessMode === 'bulk' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Em Massa
                                    </button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-4 gap-4 items-start">
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs text-slate-400 uppercase tracking-wider">
                                        {accessMode === 'individual' ? 'EMAIL DO USUÁRIO' : 'LISTA DE E-MAILS'}
                                    </label>
                                    {accessMode === 'individual' ? (
                                        <input 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                            placeholder="usuario@email.com"
                                            value={newUserEmail}
                                            onChange={e => setNewUserEmail(e.target.value)}
                                        />
                                    ) : (
                                        <textarea 
                                            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none font-mono"
                                            placeholder={`email1@teste.com\nemail2@teste.com\nemail3@teste.com`}
                                            value={bulkEmails}
                                            onChange={e => setBulkEmails(e.target.value)}
                                        />
                                    )}
                                    {accessMode === 'bulk' && <p className="text-[10px] text-slate-500 text-right">Separe por linha ou vírgula</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase tracking-wider">DURAÇÃO DO ACESSO</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                                        <select 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                                            value={selectedDuration}
                                            onChange={e => setSelectedDuration(e.target.value as DurationOption)}
                                        >
                                            <option value="1_month">1 Mês</option>
                                            <option value="3_months">3 Meses</option>
                                            <option value="6_months">6 Meses</option>
                                            <option value="1_year">1 Ano</option>
                                            <option value="lifetime">Vitalício</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="h-full flex items-end">
                                    <button 
                                        onClick={handleAddUser}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                                    >
                                        {accessMode === 'individual' ? <Plus className="w-4 h-4" /> : <Database className="w-4 h-4"/>}
                                        {accessMode === 'individual' ? 'Liberar Acesso' : 'Processar Lista'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Database Table */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Expira em</th>
                                        <th className="px-6 py-4">Criado em</th>
                                        <th className="px-6 py-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {subscribers.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum assinante encontrado.</td></tr>
                                    ) : subscribers.map(s => {
                                        const expirationDate = new Date(s.expirationDate);
                                        // Se o ano for maior que 2100, consideramos vitalício para exibição
                                        const isLifetime = expirationDate.getFullYear() > 2100;
                                        
                                        return (
                                        <tr key={s.email} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{s.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    s.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-900' : 
                                                    'bg-red-900/30 text-red-400 border border-red-900'
                                                }`}>
                                                    {s.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-slate-500"/>
                                                    {isLifetime ? 'Vitalício' : expirationDate.toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{new Date(s.dateAdded).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => {
                                                        if(confirm(`Remover acesso de ${s.email}?`)) {
                                                            dbService.removeSubscriber(s.email);
                                                            refreshList();
                                                        }
                                                    }} 
                                                    className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-slate-800 rounded"
                                                    title="Revogar Acesso"
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-in">
                        <h2 className="text-2xl font-bold text-white">Configurações</h2>
                        
                        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-lg max-w-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-amber-500/10 p-2 rounded-lg">
                                    <Lock className="w-6 h-6 text-amber-500"/>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Senha Padrão dos Usuários</h3>
                                    <p className="text-slate-400 text-sm">Todos os usuários (exceto admins) usam esta senha para entrar. Você pode compartilhá-la com seus clientes.</p>
                                </div>
                            </div>
                            
                            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800">
                                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Senha Atual</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text"
                                        value={defaultPassword}
                                        onChange={(e) => setDefaultPassword(e.target.value)}
                                        className="flex-1 bg-slate-900 border border-slate-700 text-indigo-300 font-mono text-lg rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    />
                                    <button 
                                        onClick={handleUpdatePassword}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
                                    >
                                        Salvar
                                    </button>
                                </div>
                                {showPasswordSuccess && (
                                    <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                        <CheckCircle className="w-4 h-4"/> Senha atualizada com sucesso!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;