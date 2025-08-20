import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_FILE = path.join(__dirname, 'store.json');

// デフォルトストア構造
const DEFAULT_STORE = {
    users: {},
    reports: [],
    products: {
        'com.example.jizai.coins20': { credits: 20, price: 320 },
        'com.example.jizai.coins100': { credits: 100, price: 1200 },
        'com.example.jizai.coins300': { credits: 300, price: 2800 }
    },
    metadata: {
        created: new Date().toISOString(),
        version: '1.0.0'
    }
};

class Store {
    constructor() {
        this.data = null;
        this.initPromise = this.init();
    }

    async init() {
        try {
            if (existsSync(STORE_FILE)) {
                const content = await readFile(STORE_FILE, 'utf-8');
                this.data = JSON.parse(content);
                console.log('📁 Store loaded from file');
            } else {
                this.data = { ...DEFAULT_STORE };
                await this.save();
                console.log('🆕 Store initialized with default data');
            }
        } catch (error) {
            console.error('❌ Store initialization error:', error);
            this.data = { ...DEFAULT_STORE };
        }
    }

    async save() {
        try {
            await writeFile(STORE_FILE, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('❌ Store save error:', error);
            throw error;
        }
    }

    async waitReady() {
        await this.initPromise;
    }

    // ユーザー管理
    async getUser(deviceId) {
        await this.waitReady();
        if (!this.data.users[deviceId]) {
            // 新規ユーザー: 初回残高10枚
            this.data.users[deviceId] = {
                credits: 10,
                createdAt: new Date().toISOString(),
                lastAccessAt: new Date().toISOString(),
                purchases: [],
                edits: []
            };
            await this.save();
            console.log(`👤 New user created: ${deviceId} with 10 credits`);
        } else {
            // アクセス時刻更新
            this.data.users[deviceId].lastAccessAt = new Date().toISOString();
            await this.save();
        }
        return this.data.users[deviceId];
    }

    async updateUserCredits(deviceId, amount) {
        await this.waitReady();
        const user = await this.getUser(deviceId);
        user.credits += amount;
        if (user.credits < 0) user.credits = 0; // 負の値防止
        await this.save();
        return user.credits;
    }

    async consumeCredit(deviceId) {
        await this.waitReady();
        const user = await this.getUser(deviceId);
        if (user.credits <= 0) {
            return false; // 残高不足
        }
        user.credits -= 1;
        user.edits.push({
            timestamp: new Date().toISOString(),
            creditsAfter: user.credits
        });
        await this.save();
        console.log(`💳 Credit consumed: ${deviceId} (${user.credits} remaining)`);
        return true;
    }

    // 課金管理
    async addPurchase(deviceId, productId, transactionId) {
        await this.waitReady();
        const user = await this.getUser(deviceId);
        const product = this.data.products[productId];
        
        if (!product) {
            throw new Error(`Unknown product: ${productId}`);
        }

        // 重複トランザクションチェック
        const existingPurchase = user.purchases.find(p => p.transactionId === transactionId);
        if (existingPurchase) {
            console.log(`⚠️ Duplicate purchase attempt: ${transactionId}`);
            return { credits: user.credits, duplicate: true };
        }

        // 残高加算
        const creditsToAdd = product.credits;
        user.credits += creditsToAdd;

        // 購入記録
        const purchase = {
            productId,
            transactionId,
            credits: creditsToAdd,
            timestamp: new Date().toISOString(),
            creditsAfter: user.credits
        };
        user.purchases.push(purchase);

        await this.save();
        
        console.log(`💰 Purchase successful: ${deviceId} +${creditsToAdd} credits (${user.credits} total)`);
        return { credits: user.credits, added: creditsToAdd };
    }

    // 通報管理
    async addReport(deviceId, jobId, reasonId, note) {
        await this.waitReady();
        const report = {
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            deviceId,
            jobId: jobId || null,
            reasonId,
            note: note || '',
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        this.data.reports.push(report);
        await this.save();
        
        console.log(`🚨 Report submitted: ${report.id} from ${deviceId}`);
        return report;
    }

    // 統計情報
    async getStats() {
        await this.waitReady();
        return {
            totalUsers: Object.keys(this.data.users).length,
            totalReports: this.data.reports.length,
            totalCreditsIssued: Object.values(this.data.users).reduce((sum, user) => 
                sum + (user.purchases?.reduce((pSum, p) => pSum + p.credits, 0) || 0) + 10, 0),
            totalCreditsConsumed: Object.values(this.data.users).reduce((sum, user) => 
                sum + (user.edits?.length || 0), 0)
        };
    }
}

// シングルトンインスタンス
const store = new Store();

export default store;