
DO $$ BEGIN
  -- form_history
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_history_user_id_fkey') THEN
    ALTER TABLE form_history ADD CONSTRAINT form_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_history_txn_id_fkey') THEN
    ALTER TABLE form_history ADD CONSTRAINT form_history_txn_id_fkey FOREIGN KEY (txn_id) REFERENCES transactions(txn_id) ON DELETE SET NULL;
  END IF;
  -- orders
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT;
  END IF;
  -- payments
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_order_id_fkey') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_confirmed_by_fkey') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES users(user_id) ON DELETE SET NULL;
  END IF;
  -- transactions
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_fkey') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_order_id_fkey') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL;
  END IF;
  -- user_profile
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profile_user_id_fkey') THEN
    ALTER TABLE user_profile ADD CONSTRAINT user_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
  END IF;
  -- user_wallet
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_wallet_user_id_fkey') THEN
    ALTER TABLE user_wallet ADD CONSTRAINT user_wallet_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
  END IF;
  -- unique constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_order_id_unique') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_order_id_unique UNIQUE (order_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profile_user_id_unique') THEN
    ALTER TABLE user_profile ADD CONSTRAINT user_profile_user_id_unique UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_wallet_user_id_unique') THEN
    ALTER TABLE user_wallet ADD CONSTRAINT user_wallet_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_form_history_user ON form_history(user_id, ran_at DESC);
