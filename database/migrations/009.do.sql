ALTER TABLE employees
    DROP CONSTRAINT employees_pkey;

ALTER TABLE employees
    DROP COLUMN id;

ALTER TABLE employees
    ADD PRIMARY KEY (employee_id);
