CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`bank` text NOT NULL,
	`color` text,
	`icon` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_name_unique` ON `accounts` (`name`);--> statement-breakpoint
ALTER TABLE `card_transactions` ADD `account_id` integer REFERENCES accounts(id);--> statement-breakpoint
ALTER TABLE `fixed_templates` ADD `account_id` integer REFERENCES accounts(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `account_id` integer REFERENCES accounts(id);--> statement-breakpoint
CREATE INDEX `idx_transactions_account` ON `transactions` (`account_id`);