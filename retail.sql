DROP DATABASE IF EXISTS retail_db;
CREATE DATABASE retail_db;
USE retail_db;

CREATE TABLE Product (
	ID INT AUTO_INCREMENT PRIMARY KEY,
    ProdName VARCHAR(200) UNIQUE NOT NULL,
    Quantity DECIMAL(12,2) NOT NULL,
    Unit VARCHAR(20) NOT NULL,
    costPrice INT NOT NULL,
    salePrice INT NOT NULL,
    note VARCHAR(1000) default NULL,
    PRIMARY KEY (ID)
);

INSERT INTO Product(ProdName, Quantity, Unit, costPrice, salePrice, note) VALUES
('Product 1', 10.45, 'Plate', 1000000, 1200000, ''),
('Product 2', 123456789, 'Bleh', 9873432, 555555555, 'Nothing special');