CREATE DATABASE IF NOT EXISTS finance_bot;

USE finance_bot;

CREATE TABLE IF NOT EXISTS clientes (
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    edad INT NOT NULL,
    id INT PRIMARY KEY
);
