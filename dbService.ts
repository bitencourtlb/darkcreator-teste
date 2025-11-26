import { Subscriber } from "../types";

const DB_KEY = 'dark_creator_subscribers';
const CONFIG_KEY = 'dark_creator_config';

export const dbService = {
    getDb: (): Subscriber[] => {
        try {
            const data = localStorage.getItem(DB_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },
    
    saveDb: (data: Subscriber[]) => {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    },

    // Configurações Globais (Senha Padrão)
    getDefaultPassword: (): string => {
        try {
            const config = localStorage.getItem(CONFIG_KEY);
            return config ? JSON.parse(config).defaultPassword : 'criadoranonimo2025';
        } catch (e) { return 'criadoranonimo2025'; }
    },

    setDefaultPassword: (password: string) => {
        const config = { defaultPassword: password };
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    },

    checkSubscription: (email: string): boolean => {
        if (!email) return false;
        const normalizedEmail = email.trim().toLowerCase();

        // Lista branca de administradores
        if (normalizedEmail === 'admin@darkcreator.ai' || 
            normalizedEmail === 'lucasbitencourt2518@gmail.com') {
            return true;
        }

        // Busca o banco de dados atualizado diretamente do localStorage
        const db = dbService.getDb();
        const user = db.find(u => u.email.toLowerCase() === normalizedEmail);

        if (!user) return false;

        // Verifica expiração
        const now = new Date();
        const expiration = new Date(user.expirationDate);

        // Se a data atual for menor que a expiração, está ativo
        return now < expiration;
    },

    getAllSubscribers: () => {
        const db = dbService.getDb();
        const now = new Date();
        
        // Atualiza status dinamicamente ao ler (se expirou, marca visualmente como expired, 
        // embora a lógica real esteja no checkSubscription)
        return db.map(s => ({
            ...s,
            status: new Date(s.expirationDate) > now ? 'active' : 'expired'
        }));
    },

    addManualSubscriber: (email: string, durationInMonths: number) => {
        let db = dbService.getDb();
        const normalizedEmail = email.trim().toLowerCase();
        
        const now = new Date();
        const expirationDate = new Date();
        
        // Lógica de adição de meses/anos
        if (durationInMonths === 12) {
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        } else {
            expirationDate.setMonth(expirationDate.getMonth() + durationInMonths);
        }

        const newSub: Subscriber = {
            email: normalizedEmail,
            status: 'active',
            plan: 'Creator Pass',
            dateAdded: now.toISOString(),
            expirationDate: expirationDate.toISOString()
        };

        // Remove se já existir para atualizar
        db = db.filter(u => u.email.toLowerCase() !== normalizedEmail);
        db.push(newSub);

        dbService.saveDb(db);
        return newSub;
    },

    removeSubscriber: (email: string) => {
        let db = dbService.getDb();
        db = db.filter(u => u.email.toLowerCase() !== email.trim().toLowerCase());
        dbService.saveDb(db);
    }
};