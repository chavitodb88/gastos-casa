ALTER TABLE `import_batches` ADD `settlement_amount` real;--> statement-breakpoint
ALTER TABLE `import_batches` ADD `billing_month` integer;--> statement-breakpoint
ALTER TABLE `import_batches` ADD `billing_year` integer;--> statement-breakpoint
-- Backfill existing import batches with settlement data from card_transactions
UPDATE import_batches SET
  settlement_amount = (
    SELECT COALESCE(SUM(ct.amount), 0)
    FROM card_transactions ct
    WHERE ct.import_batch_id = import_batches.id
  ),
  billing_month = (
    SELECT ct.month
    FROM card_transactions ct
    WHERE ct.import_batch_id = import_batches.id
    GROUP BY ct.month
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  billing_year = (
    SELECT ct.year
    FROM card_transactions ct
    WHERE ct.import_batch_id = import_batches.id
    GROUP BY ct.year
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
WHERE EXISTS (
  SELECT 1 FROM card_transactions ct WHERE ct.import_batch_id = import_batches.id
);