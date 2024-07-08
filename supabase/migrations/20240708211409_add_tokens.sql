-- Create tokens table
CREATE TABLE public.tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    free_amount INTEGER NOT NULL DEFAULT 10,
    paid_amount INTEGER NOT NULL DEFAULT 0,
    last_weekly_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create usage_logs table
CREATE TABLE public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_used INTEGER NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    tokens_purchased INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update tokens
CREATE OR REPLACE FUNCTION update_tokens()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.tokens
    SET paid_amount = GREATEST(paid_amount - NEW.tokens_used, 0),
        free_amount = CASE
            WHEN paid_amount - NEW.tokens_used < 0 THEN
                GREATEST(free_amount + (paid_amount - NEW.tokens_used), 0)
            ELSE
                free_amount
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update tokens after usage
CREATE TRIGGER after_usage_log_insert
AFTER INSERT ON public.usage_logs
FOR EACH ROW
EXECUTE FUNCTION update_tokens();

-- Create function to add weekly free tokens
CREATE OR REPLACE FUNCTION add_weekly_free_tokens()
RETURNS void AS $$
BEGIN
    UPDATE public.tokens
    SET free_amount = LEAST(free_amount + 10, 10),
        last_weekly_update = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE CURRENT_TIMESTAMP - last_weekly_update >= INTERVAL '1 week';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run add_weekly_free_tokens() every day
-- Note: This requires the pg_cron extension to be enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('0 0 * * *', $$
    SELECT add_weekly_free_tokens();
$$);

-- Create function to insert tokens when a user is inserted
CREATE OR REPLACE FUNCTION insert_tokens_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.tokens (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to insert tokens after user insertion
CREATE TRIGGER after_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION insert_tokens_for_new_user();

-- Create function to update paid_amount after a transaction
CREATE OR REPLACE FUNCTION update_paid_amount_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.tokens
    SET paid_amount = paid_amount + NEW.tokens_purchased,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update paid_amount after transaction insertion
CREATE TRIGGER after_transaction_insert
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_paid_amount_after_transaction();

-- Insert tokens for existing auth.users
INSERT INTO public.tokens (user_id)
SELECT id
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.tokens);

-- Grant supabase_auth_admin access to edit public schema
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;

-- Ensure future tables, sequences, and functions also grant privileges to supabase_auth_admin
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO supabase_auth_admin;

