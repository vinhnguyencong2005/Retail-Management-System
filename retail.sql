DROP DATABASE IF EXISTS retail_db;
CREATE DATABASE retail_db;
USE retail_db;

CREATE TABLE Product (
	ID INT AUTO_INCREMENT PRIMARY KEY,
    ProdName VARCHAR(200) UNIQUE NOT NULL,
    Quantity DECIMAL(12,2) NOT NULL,
    Unit VARCHAR(30) NOT NULL,
    costPrice INT NOT NULL,
    salePrice INT NOT NULL,
    Note VARCHAR(1000) default NULL
);

INSERT INTO Product(ProdName, Quantity, Unit, costPrice, salePrice, Note) VALUES
('Product 1', 10.45, 'Plate', 1000000, 1200000, ''),
('Product 2', 123456789, 'Bleh', 9873432, 555555555, 'Nothing special');

CREATE TABLE ImportReceipt (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ImportDate DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UnitImportPrice INT NOT NULL,
    ImportQuantity DECIMAL(12,2) NOT NULL
);

CREATE TABLE Customer (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerName VARCHAR(200) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE
);

CREATE TABLE Invoice (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    InvoiceDate DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    Status ENUM('Paid', 'Unpaid') DEFAULT 'Unpaid',
    TotalAmount INT NOT NULL,
    ShippingFee INT DEFAULT 0,
    CustomerID INT NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(ID)
);

CREATE TABLE InvoiceItem (
    InvoiceID INT NOT NULL,
    ProductID INT NOT NULL,
    itemQuantity DECIMAL(12,2) NOT NULL,
    costPriceIns INT NOT NULL,
    salePriceIns INT NOT NULL,
    FOREIGN KEY (InvoiceID) REFERENCES Invoice(ID),
    FOREIGN KEY (ProductID) REFERENCES Product(ID),
    PRIMARY KEY (InvoiceID, ProductID)
);

CREATE TABLE CustomerAddress (
    CustomerID INT NOT NULL,
    CustomerAddress VARCHAR(255) NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(ID),
    PRIMARY KEY (CustomerID, CustomerAddress)
);

show tables;