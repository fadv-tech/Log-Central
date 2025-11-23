ALTER TABLE `servers` MODIFY COLUMN `hostname` varchar(255);--> statement-breakpoint
ALTER TABLE `servers` MODIFY COLUMN `ipAddress` varchar(45);--> statement-breakpoint
ALTER TABLE `servers` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `servers` ADD `lastHeartbeat` timestamp;