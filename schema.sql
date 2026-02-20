-- Create the database
CREATE DATABASE IF NOT EXISTS smartcampus;
USE smartcampus;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL, -- Storing plain text for beginner simplicity (use hashing like bcrypt in production!)
    role ENUM('Student', 'Admin', 'Technician') NOT NULL
);

-- Create the complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
    technician_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- Insert demo users to test the login
INSERT INTO users (username, password, role) VALUES 
('student1', 'pass123', 'Student'),
('admin1', 'admin123', 'Admin'),
('tech1', 'tech123', 'Technician');