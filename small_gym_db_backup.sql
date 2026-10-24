-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: localhost    Database: small_gym_db
-- ------------------------------------------------------
-- Server version	9.6.0

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
-- Table structure for table `check_ins`
--

DROP TABLE IF EXISTS `check_ins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `check_ins` (
  `checkin_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `checkin_date` date NOT NULL,
  `time_in` time NOT NULL,
  `time_out` time DEFAULT NULL,
  PRIMARY KEY (`checkin_id`),
  KEY `member_id` (`member_id`),
  CONSTRAINT `check_ins_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `check_ins`
--

LOCK TABLES `check_ins` WRITE;
/*!40000 ALTER TABLE `check_ins` DISABLE KEYS */;
INSERT INTO `check_ins` VALUES (1,1,'2026-10-01','17:30:00','19:00:00'),(2,1,'2026-10-03','18:00:00','19:30:00'),(3,1,'2026-10-06','17:45:00','19:15:00'),(4,2,'2026-10-02','16:00:00','17:30:00'),(5,2,'2026-10-05','16:15:00','18:00:00'),(6,3,'2026-10-01','07:00:00','08:30:00'),(7,3,'2026-10-04','07:15:00','08:45:00'),(8,3,'2026-10-07','07:00:00','08:30:00'),(9,4,'2026-09-25','18:00:00','19:00:00'),(10,5,'2026-09-28','17:30:00','19:00:00'),(11,6,'2026-10-05','08:00:00','09:30:00'),(12,7,'2026-09-20','18:30:00','20:00:00'),(13,8,'2026-10-03','17:00:00','18:30:00');
/*!40000 ALTER TABLE `check_ins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exercises`
--

DROP TABLE IF EXISTS `exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercises` (
  `exercise_id` int NOT NULL AUTO_INCREMENT,
  `exercise_name` varchar(100) NOT NULL,
  `muscle_group` varchar(50) NOT NULL,
  PRIMARY KEY (`exercise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exercises`
--

LOCK TABLES `exercises` WRITE;
/*!40000 ALTER TABLE `exercises` DISABLE KEYS */;
INSERT INTO `exercises` VALUES (1,'Bench Press','Chest'),(2,'Squat','Legs'),(3,'Deadlift','Back'),(4,'Shoulder Press','Shoulders'),(5,'Bicep Curl','Biceps'),(6,'Tricep Pushdown','Triceps'),(7,'Lat Pulldown','Back'),(8,'Leg Press','Legs'),(9,'Barbell Row','Back'),(10,'Plank','Core'),(11,'Treadmill Running','Cardio'),(12,'Dumbbell Lunges','Legs');
/*!40000 ALTER TABLE `exercises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `member_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `contact_no` varchar(30) DEFAULT NULL,
  `emergency_contact_no` varchar(30) DEFAULT NULL,
  `starting_date` date NOT NULL,
  `expiration_date` date NOT NULL,
  `membership_type_id` int NOT NULL,
  `offline_id` varchar(100) DEFAULT NULL,
  `qr_token` char(64) DEFAULT NULL,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `uq_members_offline_id` (`offline_id`),
  UNIQUE KEY `uq_members_qr_token` (`qr_token`),
  KEY `membership_type_id` (`membership_type_id`),
  CONSTRAINT `members_ibfk_1` FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types` (`membership_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `members`
--

LOCK TABLES `members` WRITE;
/*!40000 ALTER TABLE `members` DISABLE KEYS */;
INSERT INTO `members` VALUES (1,'Juan Dela Cruz','Meycauayan, Bulacan','09171234567','09181234567','2026-09-01','2026-10-01',1,NULL,'f9499a6ecf1411f1a322867fea1abe6ff9499abecf1411f1a322867fea1abe6f'),(2,'Maria Santos','Malolos, Bulacan','09201234567','09211234567','2026-08-15','2026-11-13',2,NULL,'f949d8b2cf1411f1a322867fea1abe6ff949d8c6cf1411f1a322867fea1abe6f'),(3,'Carlo Reyes','Marilao, Bulacan','09301234567','09311234567','2026-07-01','2027-06-30',4,NULL,'f949dc18cf1411f1a322867fea1abe6ff949dc22cf1411f1a322867fea1abe6f'),(4,'Angela Garcia','Bocaue, Bulacan','09401234567','09411234567','2026-09-20','2026-10-20',1,NULL,'f949dfcecf1411f1a322867fea1abe6ff949dfe2cf1411f1a322867fea1abe6f'),(5,'Mark Mendoza','Valenzuela City','09501234567','09511234567','2026-08-01','2026-10-30',2,NULL,'f949e258cf1411f1a322867fea1abe6ff949e262cf1411f1a322867fea1abe6f'),(6,'Sofia Cruz','Meycauayan, Bulacan','09601234567','09611234567','2026-06-01','2027-05-31',4,NULL,'f949faaecf1411f1a322867fea1abe6ff949fab8cf1411f1a322867fea1abe6f'),(7,'Daniel Flores','Obando, Bulacan','09701234567','09711234567','2026-09-10','2026-10-10',1,NULL,'f949fd4ccf1411f1a322867fea1abe6ff949fd56cf1411f1a322867fea1abe6f'),(8,'Patricia Ramos','Marilao, Bulacan','09801234567','09811234567','2026-08-20','2026-11-18',2,NULL,'f949ffa4cf1411f1a322867fea1abe6ff949ffaecf1411f1a322867fea1abe6f'),(9,'khy','bakakeng','0987654321','0987654321','2026-10-24','2026-11-23',1,'55b560b6-2443-4b77-b8cd-6bdcd80e3e0a','f94a01f2cf1411f1a322867fea1abe6ff94a01fccf1411f1a322867fea1abe6f'),(10,'ta','marina','0987654322','0912345678','2026-10-24','2026-11-23',1,'6ab0f4db-b559-4bae-9ecb-33ce08e62f1c','f94a0558cf1411f1a322867fea1abe6ff94a056ccf1411f1a322867fea1abe6f'),(11,'khy','bakakeng','091236458789','094934245545','2026-10-30','2026-11-29',1,'membership-1792762941850-ex3w6am48ti','f94a1e94cf1411f1a322867fea1abe6ff94a1ea8cf1411f1a322867fea1abe6f'),(12,'irfan','lakeside','09147285369','09147258369','2026-10-24','2026-11-23',1,'membership-1792780058896-mrlcoat0hxb','f94a218ccf1411f1a322867fea1abe6ff94a21a0cf1411f1a322867fea1abe6f'),(13,'rez','payoh','0963258147','0963258147','2026-10-24','2026-11-23',1,'membership-1792780096759-6gkxeo71kyj','f94a2402cf1411f1a322867fea1abe6ff94a240ccf1411f1a322867fea1abe6f');
/*!40000 ALTER TABLE `members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membership_types`
--

DROP TABLE IF EXISTS `membership_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membership_types` (
  `membership_type_id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int NOT NULL,
  PRIMARY KEY (`membership_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membership_types`
--

LOCK TABLES `membership_types` WRITE;
/*!40000 ALTER TABLE `membership_types` DISABLE KEYS */;
INSERT INTO `membership_types` VALUES (1,'Monthly',1500.00,30),(2,'Quarterly',4000.00,90),(3,'Semi-Annual',7500.00,180),(4,'Annual',12000.00,365);
/*!40000 ALTER TABLE `membership_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('Cash','GCash','Card','Bank Transfer') NOT NULL,
  `payment_status` enum('Paid','Pending','Refunded') DEFAULT 'Paid',
  PRIMARY KEY (`payment_id`),
  KEY `member_id` (`member_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,'2026-09-01',1500.00,'GCash','Paid'),(2,2,'2026-08-15',4000.00,'Cash','Paid'),(3,3,'2026-07-01',12000.00,'Bank Transfer','Paid'),(4,4,'2026-09-20',1500.00,'GCash','Paid'),(5,5,'2026-08-01',4000.00,'Card','Paid'),(6,6,'2026-06-01',12000.00,'Bank Transfer','Paid'),(7,7,'2026-09-10',1500.00,'Cash','Paid'),(8,8,'2026-08-20',4000.00,'GCash','Paid'),(9,1,'2026-10-01',1500.00,'GCash','Paid'),(10,2,'2026-10-01',4000.00,'Cash','Paid');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_records`
--

DROP TABLE IF EXISTS `personal_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_records` (
  `pr_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `exercise_id` int NOT NULL,
  `weight` decimal(6,2) NOT NULL,
  `reps` int NOT NULL,
  `date_achieved` date NOT NULL,
  PRIMARY KEY (`pr_id`),
  KEY `member_id` (`member_id`),
  KEY `exercise_id` (`exercise_id`),
  CONSTRAINT `personal_records_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE,
  CONSTRAINT `personal_records_ibfk_2` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`exercise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_records`
--

LOCK TABLES `personal_records` WRITE;
/*!40000 ALTER TABLE `personal_records` DISABLE KEYS */;
INSERT INTO `personal_records` VALUES (1,1,1,50.00,1,'2026-10-06'),(2,1,3,80.00,1,'2026-10-03'),(3,2,8,70.00,1,'2026-10-05'),(4,3,1,100.00,1,'2026-10-01'),(5,3,3,130.00,1,'2026-10-01'),(6,3,2,140.00,1,'2026-10-04'),(7,4,1,40.00,1,'2026-09-25'),(8,5,3,90.00,1,'2026-09-28');
/*!40000 ALTER TABLE `personal_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trainers`
--

DROP TABLE IF EXISTS `trainers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainers` (
  `trainer_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `contact_no` varchar(30) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`trainer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainers`
--

LOCK TABLES `trainers` WRITE;
/*!40000 ALTER TABLE `trainers` DISABLE KEYS */;
INSERT INTO `trainers` VALUES (1,'Coach Miguel Santos','09170001111','Strength Training'),(2,'Coach Andrea Cruz','09170002222','Weight Loss and Cardio'),(3,'Coach Kevin Reyes','09170003333','Bodybuilding'),(4,'Coach Nicole Garcia','09170004444','Functional Training');
/*!40000 ALTER TABLE `trainers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workout_logs`
--

DROP TABLE IF EXISTS `workout_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_logs` (
  `workout_log_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `exercise_id` int NOT NULL,
  `workout_date` date NOT NULL,
  `sets` int NOT NULL,
  `reps` int NOT NULL,
  `previous_weight` decimal(6,2) DEFAULT '0.00',
  `present_weight` decimal(6,2) DEFAULT '0.00',
  `workout_time` int DEFAULT NULL COMMENT 'Workout duration in minutes',
  PRIMARY KEY (`workout_log_id`),
  KEY `member_id` (`member_id`),
  KEY `exercise_id` (`exercise_id`),
  CONSTRAINT `workout_logs_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE,
  CONSTRAINT `workout_logs_ibfk_2` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`exercise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workout_logs`
--

LOCK TABLES `workout_logs` WRITE;
/*!40000 ALTER TABLE `workout_logs` DISABLE KEYS */;
INSERT INTO `workout_logs` VALUES (1,1,1,'2026-10-01',4,10,40.00,45.00,20),(2,1,4,'2026-10-01',3,10,20.00,22.50,15),(3,1,6,'2026-10-01',3,12,25.00,30.00,10),(4,1,3,'2026-10-03',4,8,60.00,65.00,25),(5,1,7,'2026-10-03',3,10,45.00,50.00,15),(6,2,11,'2026-10-02',1,30,0.00,0.00,30),(7,2,8,'2026-10-02',3,15,50.00,55.00,15),(8,2,10,'2026-10-05',3,30,0.00,0.00,10),(9,3,1,'2026-10-01',5,8,80.00,85.00,25),(10,3,3,'2026-10-01',5,5,100.00,110.00,30),(11,3,2,'2026-10-04',5,8,100.00,105.00,25),(12,4,1,'2026-09-25',3,12,25.00,30.00,20),(13,5,3,'2026-09-28',4,6,70.00,75.00,25),(14,6,2,'2026-10-05',4,10,50.00,55.00,20),(15,8,7,'2026-10-03',3,12,40.00,45.00,15);
/*!40000 ALTER TABLE `workout_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workout_plan_exercises`
--

DROP TABLE IF EXISTS `workout_plan_exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_plan_exercises` (
  `plan_exercise_id` int NOT NULL AUTO_INCREMENT,
  `workout_plan_id` int NOT NULL,
  `exercise_id` int NOT NULL,
  `sets` int NOT NULL,
  `reps` int NOT NULL,
  PRIMARY KEY (`plan_exercise_id`),
  KEY `workout_plan_id` (`workout_plan_id`),
  KEY `exercise_id` (`exercise_id`),
  CONSTRAINT `workout_plan_exercises_ibfk_1` FOREIGN KEY (`workout_plan_id`) REFERENCES `workout_plans` (`workout_plan_id`) ON DELETE CASCADE,
  CONSTRAINT `workout_plan_exercises_ibfk_2` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`exercise_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workout_plan_exercises`
--

LOCK TABLES `workout_plan_exercises` WRITE;
/*!40000 ALTER TABLE `workout_plan_exercises` DISABLE KEYS */;
INSERT INTO `workout_plan_exercises` VALUES (1,1,1,4,10),(2,1,4,3,10),(3,1,6,3,12),(4,1,3,4,8),(5,1,7,3,10),(6,1,2,4,10),(7,2,11,1,30),(8,2,8,3,15),(9,2,10,3,30),(10,3,1,5,8),(11,3,3,5,5),(12,3,2,5,8),(13,4,1,3,12),(14,4,2,3,12),(15,4,7,3,12),(16,5,3,4,6),(17,5,2,4,6);
/*!40000 ALTER TABLE `workout_plan_exercises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workout_plans`
--

DROP TABLE IF EXISTS `workout_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_plans` (
  `workout_plan_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `trainer_id` int NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  PRIMARY KEY (`workout_plan_id`),
  KEY `member_id` (`member_id`),
  KEY `trainer_id` (`trainer_id`),
  CONSTRAINT `workout_plans_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE,
  CONSTRAINT `workout_plans_ibfk_2` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workout_plans`
--

LOCK TABLES `workout_plans` WRITE;
/*!40000 ALTER TABLE `workout_plans` DISABLE KEYS */;
INSERT INTO `workout_plans` VALUES (1,1,1,'Push Pull Legs','2026-09-01'),(2,2,2,'Weight Loss Program','2026-08-15'),(3,3,3,'Bodybuilding Program','2026-07-01'),(4,4,4,'Full Body Program','2026-09-20'),(5,5,1,'Strength Program','2026-08-01');
/*!40000 ALTER TABLE `workout_plans` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-24  8:47:56
