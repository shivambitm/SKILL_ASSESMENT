-- Add sample questions for skillId 4 (Database Design)
INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, is_active)
VALUES
(4, 'Which SQL statement is used to create a table?', 'CREATE TABLE', 'INSERT INTO', 'ALTER TABLE', 'DROP TABLE', 'A', 1),
(4, 'What is a primary key?', 'A unique identifier for a record', 'A type of SQL index', 'A foreign key', 'A table constraint', 'A', 1),
(4, 'Which command is used to remove all records from a table but not the table itself?', 'DROP', 'DELETE', 'TRUNCATE', 'REMOVE', 'C', 1),
(4, 'What does the acronym ERD stand for?', 'Entity Relationship Diagram', 'Entity Relational Data', 'External Reference Data', 'Entity Referential Diagram', 'A', 1),
(4, 'Which SQL clause is used to filter the results of a query?', 'ORDER BY', 'WHERE', 'GROUP BY', 'HAVING', 'B', 1);
