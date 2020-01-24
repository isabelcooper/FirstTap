ALTER TABLE tokens
    ADD CONSTRAINT foreign_key FOREIGN KEY (employee_id) REFERENCES employees (employee_id);
