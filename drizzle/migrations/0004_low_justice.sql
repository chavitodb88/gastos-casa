CREATE TABLE `debts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`person_name` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`due_date` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`settled_at` text,
	`transaction_id` integer,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_debts_status` ON `debts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_debts_type` ON `debts` (`type`);--> statement-breakpoint
CREATE INDEX `idx_debts_person` ON `debts` (`person_name`);