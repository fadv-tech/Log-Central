CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`key` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastUsedAt` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `logStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`totalLogs` int NOT NULL DEFAULT 0,
	`debugCount` int NOT NULL DEFAULT 0,
	`infoCount` int NOT NULL DEFAULT 0,
	`warningCount` int NOT NULL DEFAULT 0,
	`errorCount` int NOT NULL DEFAULT 0,
	`criticalCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `logStatistics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `apiKeys` ADD CONSTRAINT `apiKeys_serverId_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `logStatistics` ADD CONSTRAINT `logStatistics_serverId_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE no action ON UPDATE no action;