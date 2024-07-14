-- Modify the tokens table to change the default free_amount
ALTER TABLE public.tokens
ALTER COLUMN free_amount SET DEFAULT 5;

-- Update the add_weekly_free_tokens function
CREATE OR REPLACE FUNCTION add_weekly_free_tokens()
RETURNS void AS $$
BEGIN
    UPDATE public.tokens
    SET free_amount = LEAST(free_amount + 5, 5),
        last_weekly_update = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE CURRENT_TIMESTAMP - last_weekly_update >= INTERVAL '1 week';
END;
$$ LANGUAGE plpgsql;


