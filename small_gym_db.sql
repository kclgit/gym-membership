-- Small Gym Membership, Check-in & Workout Log Database
-- Compatible with MySQL / MariaDB / phpMyAdmin

CREATE DATABASE IF NOT EXISTS small_gym_db;
USE small_gym_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS personal_records;
DROP TABLE IF EXISTS workout_logs;
DROP TABLE IF EXISTS workout_plan_exercises;
DROP TABLE IF EXISTS workout_plans;
DROP TABLE IF EXISTS check_ins;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS trainers;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS membership_types;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Membership Types
CREATE TABLE membership_types (
    membership_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL
);

-- 2. Members
CREATE TABLE members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    contact_no VARCHAR(30),
    emergency_contact_no VARCHAR(30),
    starting_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    membership_type_id INT NOT NULL,
    FOREIGN KEY (membership_type_id)
        REFERENCES membership_types(membership_type_id)
);

-- 3. Payments
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash','GCash','Card','Bank Transfer') NOT NULL,
    payment_status ENUM('Paid','Pending','Refunded') DEFAULT 'Paid',
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

-- 4. Trainers
CREATE TABLE trainers (
    trainer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(30),
    specialization VARCHAR(100)
);

-- 5. Exercises
CREATE TABLE exercises (
    exercise_id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_name VARCHAR(100) NOT NULL,
    muscle_group VARCHAR(50) NOT NULL
);

-- 6. Check-ins
CREATE TABLE check_ins (
    checkin_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    checkin_date DATE NOT NULL,
    time_in TIME NOT NULL,
    time_out TIME,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

-- 7. Workout Plans
CREATE TABLE workout_plans (
    workout_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    trainer_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,
    FOREIGN KEY (trainer_id)
        REFERENCES trainers(trainer_id)
);

-- 8. Exercises included in a workout plan
CREATE TABLE workout_plan_exercises (
    plan_exercise_id INT AUTO_INCREMENT PRIMARY KEY,
    workout_plan_id INT NOT NULL,
    exercise_id INT NOT NULL,
    sets INT NOT NULL,
    reps INT NOT NULL,
    FOREIGN KEY (workout_plan_id)
        REFERENCES workout_plans(workout_plan_id)
        ON DELETE CASCADE,
    FOREIGN KEY (exercise_id)
        REFERENCES exercises(exercise_id)
);

-- 9. Daily Workout Logs
CREATE TABLE workout_logs (
    workout_log_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    exercise_id INT NOT NULL,
    workout_date DATE NOT NULL,
    sets INT NOT NULL,
    reps INT NOT NULL,
    previous_weight DECIMAL(6,2) DEFAULT 0,
    present_weight DECIMAL(6,2) DEFAULT 0,
    workout_time INT COMMENT 'Workout duration in minutes',
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,
    FOREIGN KEY (exercise_id)
        REFERENCES exercises(exercise_id)
);

-- 10. Personal Records
CREATE TABLE personal_records (
    pr_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    exercise_id INT NOT NULL,
    weight DECIMAL(6,2) NOT NULL,
    reps INT NOT NULL,
    date_achieved DATE NOT NULL,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,
    FOREIGN KEY (exercise_id)
        REFERENCES exercises(exercise_id)
);

-- ==========================================
-- SAMPLE / POPULATED DATA
-- ==========================================

-- Membership Types
INSERT INTO membership_types (type_name, price, duration_days) VALUES
('Monthly', 1500.00, 30),
('Quarterly', 4000.00, 90),
('Semi-Annual', 7500.00, 180),
('Annual', 12000.00, 365);

-- Members
INSERT INTO members
(name, address, contact_no, emergency_contact_no, starting_date, expiration_date, membership_type_id)
VALUES
('Juan Dela Cruz', 'Meycauayan, Bulacan', '09171234567', '09181234567', '2026-09-01', '2026-10-01', 1),
('Maria Santos', 'Malolos, Bulacan', '09201234567', '09211234567', '2026-08-15', '2026-11-13', 2),
('Carlo Reyes', 'Marilao, Bulacan', '09301234567', '09311234567', '2026-07-01', '2027-06-30', 4),
('Angela Garcia', 'Bocaue, Bulacan', '09401234567', '09411234567', '2026-09-20', '2026-10-20', 1),
('Mark Mendoza', 'Valenzuela City', '09501234567', '09511234567', '2026-08-01', '2026-10-30', 2),
('Sofia Cruz', 'Meycauayan, Bulacan', '09601234567', '09611234567', '2026-06-01', '2027-05-31', 4),
('Daniel Flores', 'Obando, Bulacan', '09701234567', '09711234567', '2026-09-10', '2026-10-10', 1),
('Patricia Ramos', 'Marilao, Bulacan', '09801234567', '09811234567', '2026-08-20', '2026-11-18', 2);

-- Trainers
INSERT INTO trainers (name, contact_no, specialization) VALUES
('Coach Miguel Santos', '09170001111', 'Strength Training'),
('Coach Andrea Cruz', '09170002222', 'Weight Loss and Cardio'),
('Coach Kevin Reyes', '09170003333', 'Bodybuilding'),
('Coach Nicole Garcia', '09170004444', 'Functional Training');

-- Exercises
INSERT INTO exercises (exercise_name, muscle_group) VALUES
('Bench Press', 'Chest'),
('Squat', 'Legs'),
('Deadlift', 'Back'),
('Shoulder Press', 'Shoulders'),
('Bicep Curl', 'Biceps'),
('Tricep Pushdown', 'Triceps'),
('Lat Pulldown', 'Back'),
('Leg Press', 'Legs'),
('Barbell Row', 'Back'),
('Plank', 'Core'),
('Treadmill Running', 'Cardio'),
('Dumbbell Lunges', 'Legs');

-- Payments
INSERT INTO payments
(member_id, payment_date, amount, payment_method, payment_status)
VALUES
(1, '2026-09-01', 1500.00, 'GCash', 'Paid'),
(2, '2026-08-15', 4000.00, 'Cash', 'Paid'),
(3, '2026-07-01', 12000.00, 'Bank Transfer', 'Paid'),
(4, '2026-09-20', 1500.00, 'GCash', 'Paid'),
(5, '2026-08-01', 4000.00, 'Card', 'Paid'),
(6, '2026-06-01', 12000.00, 'Bank Transfer', 'Paid'),
(7, '2026-09-10', 1500.00, 'Cash', 'Paid'),
(8, '2026-08-20', 4000.00, 'GCash', 'Paid'),
(1, '2026-10-01', 1500.00, 'GCash', 'Paid'),
(2, '2026-10-01', 4000.00, 'Cash', 'Paid');

-- Check-in records
INSERT INTO check_ins
(member_id, checkin_date, time_in, time_out)
VALUES
(1, '2026-10-01', '17:30:00', '19:00:00'),
(1, '2026-10-03', '18:00:00', '19:30:00'),
(1, '2026-10-06', '17:45:00', '19:15:00'),
(2, '2026-10-02', '16:00:00', '17:30:00'),
(2, '2026-10-05', '16:15:00', '18:00:00'),
(3, '2026-10-01', '07:00:00', '08:30:00'),
(3, '2026-10-04', '07:15:00', '08:45:00'),
(3, '2026-10-07', '07:00:00', '08:30:00'),
(4, '2026-09-25', '18:00:00', '19:00:00'),
(5, '2026-09-28', '17:30:00', '19:00:00'),
(6, '2026-10-05', '08:00:00', '09:30:00'),
(7, '2026-09-20', '18:30:00', '20:00:00'),
(8, '2026-10-03', '17:00:00', '18:30:00');

-- Workout Plans
INSERT INTO workout_plans
(member_id, trainer_id, plan_name, start_date)
VALUES
(1, 1, 'Push Pull Legs', '2026-09-01'),
(2, 2, 'Weight Loss Program', '2026-08-15'),
(3, 3, 'Bodybuilding Program', '2026-07-01'),
(4, 4, 'Full Body Program', '2026-09-20'),
(5, 1, 'Strength Program', '2026-08-01');

-- Workout Plan Exercises
INSERT INTO workout_plan_exercises
(workout_plan_id, exercise_id, sets, reps)
VALUES
(1, 1, 4, 10),
(1, 4, 3, 10),
(1, 6, 3, 12),
(1, 3, 4, 8),
(1, 7, 3, 10),
(1, 2, 4, 10),
(2, 11, 1, 30),
(2, 8, 3, 15),
(2, 10, 3, 30),
(3, 1, 5, 8),
(3, 3, 5, 5),
(3, 2, 5, 8),
(4, 1, 3, 12),
(4, 2, 3, 12),
(4, 7, 3, 12),
(5, 3, 4, 6),
(5, 2, 4, 6);

-- Daily Workout Logs
INSERT INTO workout_logs
(member_id, exercise_id, workout_date, sets, reps, previous_weight, present_weight, workout_time)
VALUES
(1, 1, '2026-10-01', 4, 10, 40.00, 45.00, 20),
(1, 4, '2026-10-01', 3, 10, 20.00, 22.50, 15),
(1, 6, '2026-10-01', 3, 12, 25.00, 30.00, 10),
(1, 3, '2026-10-03', 4, 8, 60.00, 65.00, 25),
(1, 7, '2026-10-03', 3, 10, 45.00, 50.00, 15),
(2, 11, '2026-10-02', 1, 30, 0.00, 0.00, 30),
(2, 8, '2026-10-02', 3, 15, 50.00, 55.00, 15),
(2, 10, '2026-10-05', 3, 30, 0.00, 0.00, 10),
(3, 1, '2026-10-01', 5, 8, 80.00, 85.00, 25),
(3, 3, '2026-10-01', 5, 5, 100.00, 110.00, 30),
(3, 2, '2026-10-04', 5, 8, 100.00, 105.00, 25),
(4, 1, '2026-09-25', 3, 12, 25.00, 30.00, 20),
(5, 3, '2026-09-28', 4, 6, 70.00, 75.00, 25),
(6, 2, '2026-10-05', 4, 10, 50.00, 55.00, 20),
(8, 7, '2026-10-03', 3, 12, 40.00, 45.00, 15);

-- Personal Records
INSERT INTO personal_records
(member_id, exercise_id, weight, reps, date_achieved)
VALUES
(1, 1, 50.00, 1, '2026-10-06'),
(1, 3, 80.00, 1, '2026-10-03'),
(2, 8, 70.00, 1, '2026-10-05'),
(3, 1, 100.00, 1, '2026-10-01'),
(3, 3, 130.00, 1, '2026-10-01'),
(3, 2, 140.00, 1, '2026-10-04'),
(4, 1, 40.00, 1, '2026-09-25'),
(5, 3, 90.00, 1, '2026-09-28');

-- ==========================================
-- USEFUL QUERIES
-- ==========================================

-- View all members with their membership type
SELECT m.member_id, m.name, mt.type_name, mt.price,
       m.starting_date, m.expiration_date
FROM members m
JOIN membership_types mt
ON m.membership_type_id = mt.membership_type_id;

-- View payment history
SELECT p.payment_id, m.name, p.payment_date,
       p.amount, p.payment_method, p.payment_status
FROM payments p
JOIN members m ON p.member_id = m.member_id
ORDER BY p.payment_date DESC;

-- View attendance
SELECT c.checkin_id, m.name, c.checkin_date,
       c.time_in, c.time_out
FROM check_ins c
JOIN members m ON c.member_id = m.member_id
ORDER BY c.checkin_date DESC;

-- View workout logs
SELECT m.name, e.exercise_name, w.workout_date,
       w.sets, w.reps, w.previous_weight,
       w.present_weight, w.workout_time
FROM workout_logs w
JOIN members m ON w.member_id = m.member_id
JOIN exercises e ON w.exercise_id = e.exercise_id
ORDER BY w.workout_date DESC;

-- View personal records
SELECT m.name, e.exercise_name,
       pr.weight, pr.reps, pr.date_achieved
FROM personal_records pr
JOIN members m ON pr.member_id = m.member_id
JOIN exercises e ON pr.exercise_id = e.exercise_id
ORDER BY pr.date_achieved DESC;

-- Find members who have not checked in for 7+ days
SELECT m.member_id, m.name,
       MAX(c.checkin_date) AS last_checkin,
       DATEDIFF(CURDATE(), MAX(c.checkin_date)) AS inactive_days
FROM members m
LEFT JOIN check_ins c ON m.member_id = c.member_id
GROUP BY m.member_id, m.name
HAVING last_checkin IS NULL OR inactive_days >= 7
ORDER BY inactive_days DESC;

-- Find memberships that are expired
SELECT m.member_id, m.name,
       m.expiration_date,
       DATEDIFF(CURDATE(), m.expiration_date) AS days_expired
FROM members m
WHERE m.expiration_date < CURDATE();

-- Find memberships expiring within 7 days
SELECT m.member_id, m.name, m.expiration_date
FROM members m
WHERE m.expiration_date BETWEEN CURDATE()
AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);
