-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_a5ctive BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    icon VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, user_id) -- Prevent duplicate category names per user
);

-- Create monthly_goals table
CREATE TABLE IF NOT EXISTS monthly_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    income DECIMAL(12,2) NOT NULL,
    expenses JSONB NOT NULL, -- Array of category expenses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month) -- One goal per user per month
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL, -- Denormalized for performance
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format for easy querying
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly_history table
CREATE TABLE IF NOT EXISTS monthly_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    goal JSONB NOT NULL, -- Complete monthly goal data
    transactions JSONB NOT NULL, -- All transactions for the month
    total_income DECIMAL(12,2) NOT NULL,
    total_expenses DECIMAL(12,2) NOT NULL,
    actual_savings DECIMAL(12,2) NOT NULL,
    finalized_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month) -- One history entry per user per month
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_default ON categories(is_default);

CREATE INDEX IF NOT EXISTS idx_monthly_goals_user_id ON monthly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_month ON monthly_goals(month);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_user_month ON monthly_goals(user_id, month);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_month ON transactions(month);
CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON transactions(user_id, month);

CREATE INDEX IF NOT EXISTS idx_monthly_history_user_id ON monthly_history(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_history_month ON monthly_history(month);
CREATE INDEX IF NOT EXISTS idx_monthly_history_user_month ON monthly_history(user_id, month);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_goals_updated_at BEFORE UPDATE ON monthly_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, color, icon, is_default) VALUES
('Food & Groceries', '#FF6B6B', 'shopping-cart', true),
('Rent/Mortgage', '#4ECDC4', 'home', true),
('Utilities', '#45B7D1', 'zap', true),
('Transport', '#96CEB4', 'car', true),
('Health/Medical', '#FFEAA7', 'heart', true),
('Entertainment', '#DDA0DD', 'music', true),
('Miscellaneous', '#98D8C8', 'more-horizontal', true)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Categories policies
CREATE POLICY "Users can view own categories and default categories" ON categories
    FOR SELECT USING (
        user_id::text = auth.uid()::text OR is_default = true
    );

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (user_id::text = auth.uid()::text);

-- Monthly goals policies
CREATE POLICY "Users can manage own monthly goals" ON monthly_goals
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Transactions policies
CREATE POLICY "Users can manage own transactions" ON transactions
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Monthly history policies
CREATE POLICY "Users can manage own monthly history" ON monthly_history
    FOR ALL USING (user_id::text = auth.uid()::text);
