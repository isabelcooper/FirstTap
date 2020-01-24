CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    amount FLOAT,
    employee_id VARCHAR(16) REFERENCES employees (employee_id),
    transaction_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR,
    item_ref VARCHAR,
    kiosk_ref VARCHAR
);
