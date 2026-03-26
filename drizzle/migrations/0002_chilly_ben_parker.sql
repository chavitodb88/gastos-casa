ALTER TABLE `accounts` ADD `initial_balance` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `balance_date` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `to_account_id` integer REFERENCES accounts(id);