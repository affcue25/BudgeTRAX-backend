import { createClient } from '@supabase/supabase-js';

// Validate required environment variables
const validateEnvironmentVariables = () => {
  const missingVars = [];
  
  if (!process.env.SUPABASE_URL) {
    missingVars.push('SUPABASE_URL');
  }
  
  if (!process.env.SUPABASE_ANON_KEY) {
    missingVars.push('SUPABASE_ANON_KEY');
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please create a .env file with the following variables:');
    console.error('   SUPABASE_URL=your_supabase_project_url');
    console.error('   SUPABASE_ANON_KEY=your_supabase_anon_key');
    console.error('   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
    console.error('   JWT_SECRET=your_jwt_secret_key_here');
    console.error('\n💡 Copy env.example to .env and fill in your values');
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Only validate if we're not in a test environment
if (process.env.NODE_ENV !== 'test') {
  validateEnvironmentVariables();
}

// Create Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

// Create Supabase admin client for server-side operations
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) as string,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database connection test
export const connectDatabase = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected if tables don't exist yet
      throw error;
    }

    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    return !error || error.code === 'PGRST116';
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};
