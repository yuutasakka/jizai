// Supabase Configuration
// Database connection and configuration for production memorial storage system
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// Public client (for user-facing operations)
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    }
);

// Service client (for admin operations and bypassing RLS)
export const supabaseService = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        }
    }
);

// Storage client for file operations
export const supabaseStorage = supabase.storage;

// Database health check
export async function checkDatabaseHealth() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Database health check failed:', error.message);
            return false;
        }

        console.log('✅ Database connection healthy');
        return true;

    } catch (error) {
        console.error('❌ Database health check error:', error.message);
        return false;
    }
}

// Initialize database connection
export async function initializeDatabase() {
    try {
        console.log('🔌 Connecting to Supabase...');
        
        const healthy = await checkDatabaseHealth();
        if (!healthy) {
            throw new Error('Database health check failed');
        }

        // Check if required tables exist
        const { data: tables, error: tablesError } = await supabaseService
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', [
                'users', 
                'subscriptions', 
                'subscription_tiers',
                'vaults', 
                'family_vaults',
                'family_members',
                'memories',
                'app_store_notifications'
            ]);

        if (tablesError) {
            console.warn('⚠️ Could not verify table existence:', tablesError.message);
        } else {
            console.log(`✅ Found ${tables.length} required database tables`);
        }

        return { success: true, client: supabase };

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
    try {
        // Supabase client doesn't need explicit closure
        console.log('✅ Database connection closed gracefully');
    } catch (error) {
        console.error('❌ Error closing database connection:', error.message);
    }
}