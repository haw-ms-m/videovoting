
CREATE DATABASE IF NOT EXISTS `node` ;
USE `node`;


CREATE TABLE IF NOT EXISTS `article` (
  `a_id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(200) NOT NULL,
  `kind` varchar(20) NOT NULL,
  `link` varchar(200) DEFAULT NULL,
  `startstock` int(5) DEFAULT '0',
  `consumed` int(5) DEFAULT '0',
  PRIMARY KEY (`a_id`),
  UNIQUE KEY `description` (`description`),
  UNIQUE KEY `a_id` (`a_id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `orders` (
  `o_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `id` int(11) NOT NULL,
  `datetime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`o_id`),
  UNIQUE KEY `o_id` (`o_id`),
  KEY `FK_orders_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `positions` (
  `p_id` int(11) NOT NULL AUTO_INCREMENT,
  `o_id` int(11) NOT NULL,
  `a_id` int(11) NOT NULL,
  `amount` int(20) NOT NULL,
  PRIMARY KEY (`p_id`),
  UNIQUE KEY `p_id` (`p_id`),
  KEY `FK_positions_orders` (`o_id`),
  KEY `FK_positions_article` (`a_id`),
  CONSTRAINT `FK_positions_article` FOREIGN KEY (`a_id`) REFERENCES `article` (`a_id`),
  CONSTRAINT `FK_positions_orders` FOREIGN KEY (`o_id`) REFERENCES `orders` (`o_id`)
) ENGINE=InnoDB AUTO_INCREMENT=323 DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `password` varchar(200) NOT NULL,
  `role` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8;

