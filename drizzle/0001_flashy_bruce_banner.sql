CREATE TABLE `logFilters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`filterConfig` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `logFilters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`sourceType` varchar(100) NOT NULL,
	`sourceConfig` text,
	`isEnabled` int NOT NULL DEFAULT 1,
	`lastIngestedAt` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `logSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`timestamp` int NOT NULL,
	`level` enum('debug','info','warning','error','critical') NOT NULL,
	`source` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`tags` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`hostname` varchar(255) NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`serverType` enum('linux','windows','mikrotik','other') NOT NULL,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `servers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `logFilters` ADD CONSTRAINT `logFilters_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `logSources` ADD CONSTRAINT `logSources_serverId_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `logs` ADD CONSTRAINT `logs_serverId_servers_id_fk` FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON DELETE no action ON UPDATE no action;