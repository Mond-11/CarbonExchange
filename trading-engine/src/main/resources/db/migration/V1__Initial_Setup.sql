CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    money_balance DECIMAL(19, 2) NOT NULL,
    credit_balance DECIMAL(19, 2) NOT NULL
);

CREATE TABLE executed_trades (
    id UUID PRIMARY KEY,
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 4) NOT NULL,
    executed_at TIMESTAMP NOT NULL
);
