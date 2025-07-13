INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, is_active)
VALUES
(4, 'Which SQL statement is used to create a table?', 'CREATE TABLE', 'INSERT INTO', 'ALTER TABLE', 'DROP TABLE', 'A', 1),
(4, 'What is a primary key?', 'A unique identifier for a record', 'A type of SQL index', 'A foreign key', 'A table constraint', 'A', 1),
(4, 'Which command is used to remove all records from a table but not the table itself?', 'DROP', 'DELETE', 'TRUNCATE', 'REMOVE', 'C', 1),
(4, 'What does the acronym ERD stand for?', 'Entity Relationship Diagram', 'Entity Relational Data', 'External Reference Data', 'Entity Referential Diagram', 'A', 1),
(4, 'Which SQL clause is used to filter the results of a query?', 'ORDER BY', 'WHERE', 'GROUP BY', 'HAVING', 'B', 1),
-- More database design questions for skill_id 4
(4, 'Which of the following is NOT a valid SQL data type?', 'VARCHAR', 'INTEGER', 'BOOLEAN', 'ARRAY', 'D', 1),
(4, 'What is the purpose of a foreign key?', 'To uniquely identify a record', 'To link two tables together', 'To create an index', 'To delete a table', 'B', 1),
(4, 'Which SQL keyword is used to sort the result-set?', 'ORDER BY', 'GROUP BY', 'SORT', 'FILTER', 'A', 1),
(4, 'Which constraint ensures that a column cannot have NULL values?', 'UNIQUE', 'NOT NULL', 'PRIMARY KEY', 'FOREIGN KEY', 'B', 1),
(4, 'Which command is used to remove a table from a database?', 'DELETE', 'DROP', 'REMOVE', 'TRUNCATE', 'B', 1),
(4, 'Which SQL function returns the number of rows in a table?', 'COUNT()', 'SUM()', 'TOTAL()', 'NUMBER()', 'A', 1),
(4, 'What does normalization in databases aim to achieve?', 'Reduce redundancy', 'Increase redundancy', 'Improve performance', 'Add more tables', 'A', 1),
(4, 'Which normal form eliminates duplicate columns from the same table?', '1NF', '2NF', '3NF', 'BCNF', 'A', 1),
(4, 'Which SQL statement is used to modify data in a table?', 'UPDATE', 'INSERT', 'ALTER', 'SELECT', 'A', 1),
(4, 'Which clause is used to group rows that have the same values?', 'ORDER BY', 'GROUP BY', 'HAVING', 'WHERE', 'B', 1),
(4, 'Which SQL statement is used to remove a table from the database?', 'DROP TABLE', 'DELETE TABLE', 'REMOVE TABLE', 'TRUNCATE TABLE', 'A', 1),
(4, 'Which of the following is a DDL command?', 'SELECT', 'INSERT', 'CREATE', 'UPDATE', 'C', 1),
(4, 'Which SQL keyword is used to prevent duplicate values in a column?', 'UNIQUE', 'PRIMARY', 'FOREIGN', 'CHECK', 'A', 1),
(4, 'Which SQL clause is used to limit the number of rows returned?', 'LIMIT', 'WHERE', 'ORDER BY', 'GROUP BY', 'A', 1),
(4, 'Which of the following is a valid SQL comment?', '-- comment', '/* comment */', '# comment', 'All of the above', 'D', 1);
