-- MySQL dump 10.13  Distrib 8.2.0, for Linux (x86_64)
--
-- Host: localhost    Database: new-api
-- ------------------------------------------------------
-- Server version	8.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `abilities`
--

DROP TABLE IF EXISTS `abilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `abilities` (
  `group` varchar(64) NOT NULL,
  `model` varchar(255) NOT NULL,
  `channel_id` bigint NOT NULL,
  `enabled` tinyint(1) DEFAULT NULL,
  `priority` bigint DEFAULT '0',
  `weight` bigint unsigned DEFAULT '0',
  `tag` varchar(191) DEFAULT NULL,
  `is_tools` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`group`,`model`,`channel_id`),
  KEY `idx_abilities_channel_id` (`channel_id`),
  KEY `idx_abilities_priority` (`priority`),
  KEY `idx_abilities_weight` (`weight`),
  KEY `idx_abilities_tag` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `agent_commission_logs`
--

DROP TABLE IF EXISTS `agent_commission_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_commission_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_user_id` bigint DEFAULT NULL,
  `created_at` bigint DEFAULT NULL,
  `amount` double DEFAULT NULL,
  `remark` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `agent_withdraw_records`
--

DROP TABLE IF EXISTS `agent_withdraw_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_withdraw_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `withdraw_amount` bigint DEFAULT NULL,
  `withdraw_type` longtext,
  `withdraw_account` longtext,
  `withdraw_name` longtext,
  `handled_by_user` bigint DEFAULT NULL,
  `created_at` bigint DEFAULT NULL,
  `update_at` bigint DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `remark` longtext,
  PRIMARY KEY (`id`),
  KEY `idx_agent_withdraw_records_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `trie` bigint DEFAULT NULL,
  `status` bigint DEFAULT '1',
  `system_name` longtext,
  `logo` longtext,
  `domain` varchar(191) DEFAULT NULL,
  `withdraw_type` longtext,
  `withdraw_account` longtext,
  `created_at` bigint DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `group_rate` longtext,
  `total_commission_amount` bigint DEFAULT '0',
  `withdraw_amount` bigint DEFAULT '0',
  `upstream_agent_id` bigint DEFAULT NULL,
  `seo_description` longtext,
  `seo_keywords` longtext,
  `qrcode` longtext,
  `homepage` longtext,
  `notice` longtext,
  `show_notice` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_agents_user_id` (`user_id`),
  UNIQUE KEY `uni_agents_domain` (`domain`),
  KEY `idx_agents_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tag` longtext,
  `title` longtext,
  `description` longtext,
  `content` longtext,
  `status` varchar(16) DEFAULT 'draft',
  `read_auth` longtext,
  `created_at` bigint DEFAULT NULL,
  `updated_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `channels`
--

DROP TABLE IF EXISTS `channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channels` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` bigint DEFAULT '0',
  `key` longtext NOT NULL,
  `open_ai_organization` longtext,
  `test_model` longtext,
  `status` bigint DEFAULT '1',
  `name` varchar(191) DEFAULT NULL,
  `weight` bigint unsigned DEFAULT '0',
  `created_time` bigint DEFAULT NULL,
  `test_time` bigint DEFAULT NULL,
  `response_time` bigint DEFAULT NULL,
  `base_url` varchar(191) DEFAULT '',
  `other` longtext,
  `balance` double DEFAULT NULL,
  `balance_updated_time` bigint DEFAULT NULL,
  `models` longtext,
  `group` varchar(64) DEFAULT 'default',
  `used_quota` bigint DEFAULT '0',
  `model_mapping` text,
  `status_code_mapping` varchar(1024) DEFAULT '',
  `priority` bigint DEFAULT '0',
  `auto_ban` bigint DEFAULT '1',
  `other_info` longtext,
  `tag` varchar(191) DEFAULT NULL,
  `setting` text,
  `param_override` text,
  `access_token` longtext,
  `upstream_user_quota` double DEFAULT '0',
  `headers` varchar(1024) DEFAULT '',
  `empty_response_retry` bigint DEFAULT '0',
  `not_use_key` bigint DEFAULT '0',
  `remark` longtext,
  `mj_relax_limit` bigint DEFAULT '99',
  `mj_fast_limit` bigint DEFAULT '99',
  `mj_turbo_limit` bigint DEFAULT '99',
  `channel_ratio` double DEFAULT '1',
  `error_return429` bigint DEFAULT '0',
  `is_tools` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_channels_tag` (`tag`),
  KEY `idx_channels_name` (`name`),
  KEY `idx_channels_group` (`group`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `check_ins`
--

DROP TABLE IF EXISTS `check_ins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `check_ins` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `check_in_at` datetime(3) DEFAULT NULL,
  `quota` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_check_ins_user_id` (`user_id`),
  KEY `idx_check_ins_check_in_at` (`check_in_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `invoice_type` varchar(32) DEFAULT NULL,
  `invoice_amount` double DEFAULT '0',
  `invoice_title` varchar(255) DEFAULT NULL,
  `invoice_tax_id` varchar(255) DEFAULT NULL,
  `invoice_remark` varchar(255) DEFAULT NULL,
  `invoice_email` varchar(255) DEFAULT NULL,
  `reply` varchar(255) DEFAULT NULL,
  `status` varchar(32) DEFAULT NULL,
  `created_at` bigint DEFAULT NULL,
  `updated_at` bigint DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_invoices_uuid` (`uuid`),
  KEY `idx_invoices_deleted_at` (`deleted_at`),
  KEY `idx_invoices_user_id` (`user_id`),
  KEY `idx_invoices_invoice_type` (`invoice_type`),
  KEY `idx_invoices_invoice_title` (`invoice_title`),
  KEY `idx_invoices_invoice_tax_id` (`invoice_tax_id`),
  KEY `idx_invoices_status` (`status`),
  KEY `idx_invoices_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `created_at` bigint DEFAULT NULL,
  `type` bigint DEFAULT NULL,
  `content` longtext,
  `username` varchar(191) DEFAULT '',
  `token_name` varchar(191) DEFAULT '',
  `model_name` varchar(191) DEFAULT '',
  `quota` bigint DEFAULT '0',
  `prompt_tokens` bigint DEFAULT '0',
  `completion_tokens` bigint DEFAULT '0',
  `use_time` bigint DEFAULT '0',
  `is_stream` tinyint(1) DEFAULT '0',
  `channel_id` bigint DEFAULT NULL,
  `channel_name` longtext,
  `token_id` bigint DEFAULT '0',
  `group` varchar(191) DEFAULT NULL,
  `other` longtext,
  `token_group` varchar(191) DEFAULT '',
  `ip` varchar(191) DEFAULT NULL,
  `response_id` varchar(191) DEFAULT NULL,
  `request_id` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_logs_model_name` (`model_name`),
  KEY `idx_logs_group` (`group`),
  KEY `idx_logs_token_name` (`token_name`),
  KEY `idx_logs_channel_id` (`channel_id`),
  KEY `idx_logs_token_id` (`token_id`),
  KEY `idx_created_at_id` (`id`,`created_at`),
  KEY `idx_logs_user_id` (`user_id`),
  KEY `idx_created_at_type` (`created_at`,`type`),
  KEY `idx_logs_username` (`username`),
  KEY `index_username_model_name` (`model_name`,`username`),
  KEY `idx_logs_request_id` (`request_id`),
  KEY `idx_logs_token_group` (`token_group`),
  KEY `idx_logs_ip` (`ip`),
  KEY `idx_logs_response_id` (`response_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6849466 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `midjourneys`
--

DROP TABLE IF EXISTS `midjourneys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `midjourneys` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(40) DEFAULT NULL,
  `mj_id` varchar(191) DEFAULT NULL,
  `prompt` longtext,
  `prompt_en` longtext,
  `description` longtext,
  `state` longtext,
  `submit_time` bigint DEFAULT NULL,
  `start_time` bigint DEFAULT NULL,
  `finish_time` bigint DEFAULT NULL,
  `image_url` longtext,
  `status` varchar(20) DEFAULT NULL,
  `progress` varchar(30) DEFAULT NULL,
  `fail_reason` longtext,
  `channel_id` bigint DEFAULT NULL,
  `quota` bigint DEFAULT NULL,
  `buttons` longtext,
  `properties` longtext,
  `image_height` bigint DEFAULT NULL,
  `image_width` bigint DEFAULT NULL,
  `agent_profit` bigint DEFAULT NULL,
  `mode` varchar(191) DEFAULT NULL,
  `proxy` longtext,
  `token_id` bigint DEFAULT NULL,
  `notify_hook` longtext,
  `storage_enabled` tinyint(1) DEFAULT NULL,
  `image_urls` longtext,
  `video_url` longtext,
  `video_urls` longtext,
  PRIMARY KEY (`id`),
  KEY `idx_midjourneys_submit_time` (`submit_time`),
  KEY `idx_midjourneys_start_time` (`start_time`),
  KEY `idx_midjourneys_finish_time` (`finish_time`),
  KEY `idx_midjourneys_status` (`status`),
  KEY `idx_midjourneys_progress` (`progress`),
  KEY `idx_midjourneys_user_id` (`user_id`),
  KEY `idx_midjourneys_action` (`action`),
  KEY `idx_midjourneys_mj_id` (`mj_id`),
  KEY `idx_midjourneys_mode` (`mode`)
) ENGINE=InnoDB AUTO_INCREMENT=232681 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `options`
--

DROP TABLE IF EXISTS `options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `options` (
  `key` varchar(191) NOT NULL,
  `value` longtext,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `gateway_id` bigint DEFAULT NULL,
  `trade_no` varchar(50) DEFAULT NULL,
  `gateway_no` varchar(100) DEFAULT NULL,
  `amount` bigint DEFAULT '0',
  `order_amount` decimal(10,2) DEFAULT '0.00',
  `order_currency` varchar(16) DEFAULT NULL,
  `quota` bigint DEFAULT '0',
  `fee` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `status` varchar(32) DEFAULT NULL,
  `created_at` bigint DEFAULT NULL,
  `updated_at` bigint DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_orders_trade_no` (`trade_no`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_deleted_at` (`deleted_at`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_gateway_id` (`gateway_id`),
  KEY `idx_orders_gateway_no` (`gateway_no`),
  KEY `idx_orders_order_currency` (`order_currency`)
) ENGINE=InnoDB AUTO_INCREMENT=2021 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` varchar(16) DEFAULT NULL,
  `uuid` char(32) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `icon` varchar(300) DEFAULT NULL,
  `notify_domain` varchar(300) DEFAULT NULL,
  `fixed_fee` decimal(10,2) DEFAULT '0.00',
  `percent_fee` decimal(10,2) DEFAULT '0.00',
  `currency` varchar(5) DEFAULT NULL,
  `currency_discount` decimal(10,2) DEFAULT '1.00',
  `config` text,
  `sort` bigint DEFAULT '1',
  `enable` tinyint(1) DEFAULT '1',
  `created_at` bigint DEFAULT NULL,
  `updated_at` bigint DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `min_amount` bigint DEFAULT '0',
  `max_amount` bigint DEFAULT '0',
  `enable_invoice` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_payments_uuid` (`uuid`),
  KEY `idx_payments_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quota_data`
--

DROP TABLE IF EXISTS `quota_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quota_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `username` varchar(64) DEFAULT '',
  `model_name` varchar(64) DEFAULT '',
  `created_at` bigint DEFAULT NULL,
  `token_used` bigint DEFAULT '0',
  `count` bigint DEFAULT '0',
  `quota` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_qdt_created_at` (`created_at`),
  KEY `idx_quota_data_user_id` (`user_id`),
  KEY `idx_qdt_model_user_name` (`model_name`,`username`)
) ENGINE=InnoDB AUTO_INCREMENT=97254 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `redemptions`
--

DROP TABLE IF EXISTS `redemptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `redemptions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `key` char(32) DEFAULT NULL,
  `status` bigint DEFAULT '1',
  `name` varchar(191) DEFAULT NULL,
  `quota` bigint DEFAULT '100',
  `created_time` bigint DEFAULT NULL,
  `redeemed_time` bigint DEFAULT NULL,
  `used_user_id` bigint DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `start_time` bigint DEFAULT NULL,
  `expired_time` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_redemptions_key` (`key`),
  KEY `idx_redemptions_name` (`name`),
  KEY `idx_redemptions_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=414 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schema_version`
--

DROP TABLE IF EXISTS `schema_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_version` (
  `id` int NOT NULL AUTO_INCREMENT,
  `version` varchar(50) NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `search_analysis_configs`
--

DROP TABLE IF EXISTS `search_analysis_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `search_analysis_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` longtext,
  `model` longtext,
  `base_url` longtext,
  `api_key` longtext,
  `max_context_messages` bigint DEFAULT NULL,
  `min_confidence` double DEFAULT NULL,
  `system_prompt` longtext,
  `status` bigint DEFAULT NULL,
  `created_at` bigint DEFAULT NULL,
  `updated_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `search_engines`
--

DROP TABLE IF EXISTS `search_engines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `search_engines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` longtext,
  `type` longtext,
  `base_url` longtext,
  `api_key` longtext,
  `token_per_use` bigint DEFAULT NULL,
  `status` bigint DEFAULT NULL,
  `created_at` bigint DEFAULT NULL,
  `updated_at` bigint DEFAULT NULL,
  `search_model` longtext,
  `search_context_size` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `setups`
--

DROP TABLE IF EXISTS `setups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `version` varchar(50) NOT NULL,
  `initialized_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` bigint DEFAULT NULL,
  `updated_at` bigint DEFAULT NULL,
  `task_id` varchar(50) DEFAULT NULL,
  `platform` varchar(30) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `channel_id` bigint DEFAULT NULL,
  `quota` bigint DEFAULT NULL,
  `action` varchar(40) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `fail_reason` longtext,
  `submit_time` bigint DEFAULT NULL,
  `start_time` bigint DEFAULT NULL,
  `finish_time` bigint DEFAULT NULL,
  `progress` varchar(20) DEFAULT NULL,
  `properties` json DEFAULT NULL,
  `data` json DEFAULT NULL,
  `token_id` bigint DEFAULT '0',
  `agent_profit` bigint DEFAULT NULL,
  `callback_url` longtext,
  `tags` longtext,
  `storage_enabled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_tasks_created_at` (`created_at`),
  KEY `idx_tasks_platform` (`platform`),
  KEY `idx_tasks_channel_id` (`channel_id`),
  KEY `idx_tasks_action` (`action`),
  KEY `idx_tasks_status` (`status`),
  KEY `idx_tasks_submit_time` (`submit_time`),
  KEY `idx_tasks_finish_time` (`finish_time`),
  KEY `idx_tasks_task_id` (`task_id`),
  KEY `idx_tasks_user_id` (`user_id`),
  KEY `idx_tasks_start_time` (`start_time`),
  KEY `idx_tasks_progress` (`progress`)
) ENGINE=InnoDB AUTO_INCREMENT=10621 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `key` char(48) DEFAULT NULL,
  `status` bigint DEFAULT '1',
  `name` varchar(191) DEFAULT NULL,
  `created_time` bigint DEFAULT NULL,
  `accessed_time` bigint DEFAULT NULL,
  `expired_time` bigint DEFAULT '-1',
  `remain_quota` bigint DEFAULT '0',
  `unlimited_quota` tinyint(1) DEFAULT '1',
  `model_limits_enabled` tinyint(1) DEFAULT '0',
  `model_limits` varchar(1024) DEFAULT '',
  `allow_ips` varchar(191) DEFAULT '',
  `used_quota` bigint DEFAULT '0',
  `group` varchar(1024) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `mj_mode` varchar(32) DEFAULT '默认',
  `mj_cdn` varchar(64) DEFAULT '默认',
  `mj_cdn_addr` varchar(1024) DEFAULT NULL,
  `exclude_ips` varchar(191) DEFAULT '',
  `rate_limits_enabled` tinyint(1) DEFAULT '0',
  `rate_limits_time` bigint DEFAULT '0',
  `rate_limits_count` bigint DEFAULT '0',
  `rate_limits_content` varchar(1024) DEFAULT NULL,
  `storage_enabled` tinyint(1) DEFAULT '0',
  `remain_count` bigint DEFAULT '0',
  `unlimited_count` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tokens_key` (`key`),
  KEY `idx_tokens_user_id` (`user_id`),
  KEY `idx_tokens_name` (`name`),
  KEY `idx_tokens_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4831 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `top_ups`
--

DROP TABLE IF EXISTS `top_ups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `top_ups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `amount` bigint DEFAULT NULL,
  `money` double DEFAULT NULL,
  `trade_no` longtext,
  `create_time` bigint DEFAULT NULL,
  `status` longtext,
  `complete_time` bigint DEFAULT NULL,
  `agent_user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_top_ups_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_push_settings`
--

DROP TABLE IF EXISTS `user_push_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_push_settings` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `subscription_options` varchar(255) DEFAULT NULL,
  `notice_type` varchar(20) DEFAULT NULL,
  `notice_email` varchar(100) DEFAULT NULL,
  `qiye_wx_webhook_url` varchar(255) DEFAULT NULL,
  `notice_receiver_uid` varchar(100) DEFAULT NULL,
  `ding_talk_webhook_url` varchar(255) DEFAULT NULL,
  `ding_talk_secret` varchar(255) DEFAULT NULL,
  `ding_talk_phone` varchar(100) DEFAULT NULL,
  `feishu_webhook_url` varchar(255) DEFAULT NULL,
  `feishu_secret` varchar(255) DEFAULT NULL,
  `feishu_at` varchar(100) DEFAULT NULL,
  `webhook_url` varchar(255) DEFAULT NULL,
  `webhook_token` varchar(255) DEFAULT NULL,
  `telegram_token` varchar(255) DEFAULT NULL,
  `telegram_chat_id` varchar(255) DEFAULT NULL,
  `tip_quota` bigint DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `idx_user_push_settings_user_id` (`user_id`),
  CONSTRAINT `fk_users_push_settings` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2622 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(191) DEFAULT NULL,
  `password` longtext NOT NULL,
  `display_name` varchar(191) DEFAULT NULL,
  `role` bigint DEFAULT '1',
  `status` bigint DEFAULT '1',
  `email` varchar(191) DEFAULT NULL,
  `github_id` varchar(191) DEFAULT NULL,
  `oidc_id` varchar(191) DEFAULT NULL,
  `wechat_id` varchar(191) DEFAULT NULL,
  `telegram_id` varchar(191) DEFAULT NULL,
  `access_token` char(32) DEFAULT NULL,
  `quota` bigint DEFAULT '0',
  `used_quota` bigint DEFAULT '0',
  `request_count` bigint DEFAULT '0',
  `group` varchar(64) DEFAULT 'default',
  `aff_code` varchar(32) DEFAULT NULL,
  `aff_count` bigint DEFAULT '0',
  `aff_quota` bigint DEFAULT '0',
  `aff_history` bigint DEFAULT '0',
  `inviter_id` bigint DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `linux_do_id` varchar(191) DEFAULT NULL,
  `setting` text,
  `google_id` varchar(191) DEFAULT NULL,
  `linuxdo_id` varchar(191) DEFAULT NULL,
  `topup_amount` decimal(15,2) DEFAULT '0.00',
  `invoice_amount` decimal(15,2) DEFAULT '0.00',
  `topup_count` bigint DEFAULT '0',
  `stripe_customer` varchar(191) DEFAULT NULL,
  `created_at` bigint DEFAULT NULL,
  `last_login_at` bigint DEFAULT NULL,
  `level` varchar(191) DEFAULT 'Tier 1',
  `group_ratio` varchar(1024) DEFAULT '{}',
  `model_ratio` varchar(1024) DEFAULT '{}',
  `rate_limits` varchar(1024) DEFAULT '{}',
  `agent_user_id` bigint DEFAULT '1',
  `use_group` longtext,
  `model_limits_enabled` tinyint(1) DEFAULT '0',
  `model_limits` varchar(1024) DEFAULT '',
  `session_version` bigint DEFAULT '0',
  `topup_enabled` tinyint(1) DEFAULT '1',
  `avatar` varchar(255) DEFAULT 'Upstream.svg',
  `remark` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_access_token` (`access_token`),
  UNIQUE KEY `idx_users_aff_code` (`aff_code`),
  UNIQUE KEY `uni_users_username` (`username`),
  KEY `idx_users_we_chat_id` (`wechat_id`),
  KEY `idx_users_telegram_id` (`telegram_id`),
  KEY `idx_users_inviter_id` (`inviter_id`),
  KEY `idx_users_deleted_at` (`deleted_at`),
  KEY `idx_users_git_hub_id` (`github_id`),
  KEY `idx_users_oidc_id` (`oidc_id`),
  KEY `idx_users_linux_do_id` (`linux_do_id`),
  KEY `idx_users_username` (`username`),
  KEY `idx_users_display_name` (`display_name`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_stripe_customer` (`stripe_customer`),
  KEY `idx_users_level` (`level`),
  KEY `idx_users_google_id` (`google_id`),
  KEY `idx_users_agent_user_id` (`agent_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2622 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `verifications`
--

DROP TABLE IF EXISTS `verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verifications` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `type` longtext,
  `name` longtext,
  `id_card_number` longtext,
  `id_card_image` longtext,
  `certify_id` longtext,
  `company_name` longtext,
  `credit_code` longtext,
  `legal_person` longtext,
  `legal_person_id_card` longtext,
  `business_license_image` longtext,
  `status` longtext,
  `verify_message` longtext,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `id_card_type` longtext,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `idx_verifications_user_id` (`user_id`),
  CONSTRAINT `fk_users_verify_info` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-18  7:19:36
