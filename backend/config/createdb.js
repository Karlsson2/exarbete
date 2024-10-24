import mysql from "mysql2/promise";

// Kör node.js createdb flr att sätta upp databasen.

// Replace these with your actual MySQL credentials
const dbConfig = {
  host: "localhost",
  user: "root", // MySQL username
  password: "", // MySQL password
  // database will be specified later
};

// Name of the database to create
const databaseName = "beautytestdb"; //(OOPS!!) IF YOU TAKE beauty.db as name or the same name as you already have it will reset it with new tables and info.

// SQL Statements for Table Creation
const tableCreationQueries = [
  // Table: Users
  `CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Table: Categories
  `CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100),
    parent_category_id INT,
    FOREIGN KEY (parent_category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
  );`,

  // Table: serviceCategories
  `CREATE TABLE serviceCategories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100)
  );`,

  // Table: Products
  `CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    stock_quantity INT,
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
  );`,

  // Table: ProductImages
  `CREATE TABLE ProductImages (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    image_url VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
  );`,

  // Table: Orders
  `CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    order_status VARCHAR(50),
    total_amount DECIMAL(10,2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    city VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
  );`,

  // Table: OrderDetails
  `CREATE TABLE OrderDetails (
    order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE SET NULL
  );`,

  // Table: Services
  `CREATE TABLE Services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    time INT, -- Duration in minutes
    price DECIMAL(10,2),
    category_id INT,
    before_image_url VARCHAR(255),
    after_image_url VARCHAR(255),
    booking_link VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES serviceCategories(category_id) ON DELETE SET NULL
  );`,

  // Table: Events
  `CREATE TABLE Events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    image_url VARCHAR(255),
    booking_link VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,

  // Table: Courses
  `CREATE TABLE Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    schedule DATETIME,
    image_url VARCHAR(255),
    booking_link VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,

  // Table: ProductReviews
  `CREATE TABLE ProductReviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
  );`,

  // Table: PageReviews
  `CREATE TABLE PageReviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
];

// SQL Statements for Inserting Dummy Data
const insertDataQueries = [
  // Insert into Users
  `INSERT INTO Users (role, first_name, last_name, email, password, phone)
  VALUES
  ('admin', 'Emily', 'Blossom', 'emily.blossom@beautywellness.com', 'hashed_password1', "123-456-7890"),
  ('customer', 'Sophia', 'Grace', 'sophia.grace@example.com', 'hashed_password2', "123-456-7890"),
  ('customer', 'Liam', 'Johnson', 'liam.johnson@example.com', 'hashed_password3', "123-456-7890");`,

  // Insert into Categories
  `INSERT INTO Categories (category_name, parent_category_id) VALUES
  ('Skincare', NULL),
  ('Haircare', NULL),
  ('Makeup', NULL),
  ('Facials', 1),
  ('Massages', NULL),
  ('Manicures & Pedicures', NULL);`,

  // Insert into serviceCategories
  `INSERT INTO serviceCategories (category_name) VALUES
  ('Facial Treatments' ),
  ('Massage Therapies'),
  ('Nail Services'),
  ('Hair Services');`,

  // Insert into Products
  `INSERT INTO Products (product_name, description, price, stock_quantity, category_id)
  VALUES
  ('Hydrating Facial Cream', 'Deeply moisturizes and revitalizes skin.', 29.99, 150, 1),
  ('Organic Shampoo', 'Gentle cleansing with natural ingredients.', 15.99, 200, 2),
  ('Matte Liquid Lipstick', 'Long-lasting matte finish in various shades.', 19.99, 100, 3),
  ('Revitalizing Hair Mask', 'Nourishes and strengthens hair.', 25.99, 80, 2);`,

  // Insert into ProductImages
  `INSERT INTO ProductImages (product_id, image_url, is_primary) VALUES
  (1, 'http://example.com/images/hydrating_facial_cream_primary.jpg', TRUE),
  (1, 'http://example.com/images/hydrating_facial_cream_side.jpg', FALSE),
  (2, 'http://example.com/images/organic_shampoo_primary.jpg', TRUE),
  (3, 'http://example.com/images/matte_lipstick_primary.jpg', TRUE),
  (4, 'http://example.com/images/hair_mask_primary.jpg', TRUE);`,

  // Insert into Orders
  `INSERT INTO Orders (user_id, order_status, total_amount, address_line1, address_line2, postal_code, country, city)
  VALUES
  (2, 'Confirmed', 65.97, '123 Main St', 'Apt 101', '12345', 'USA', 'Springfield'),
  (3, 'Pending', 19.99, '456 Main St', 'Apt 101', '12345', 'USA', 'Springfield');`,

  // Insert into OrderDetails
  `INSERT INTO OrderDetails (order_id, product_id, quantity, unit_price)
  VALUES
  (1, 1, 2, 29.99),
  (1, 2, 1, 15.99),
  (2, 3, 1, 19.99);`,

  // Insert into Services
  `INSERT INTO Services (name, description, time, price, category_id, booking_link)
  VALUES
  ('Classic Facial', 'A comprehensive facial treatment for all skin types.', 60, 75.00, 1, 'http://beautywellness.com/book/classic-facial'),
  ('Deep Tissue Massage', 'Intense massage targeting deep muscle layers.', 90, 120.00, 2, 'http://beautywellness.com/book/deep-tissue-massage'),
  ('Gel Manicure', 'Professional manicure with long-lasting gel polish.', 45, 40.00, 3, 'http://beautywellness.com/book/gel-manicure'),
  ('Hair Coloring', 'Expert hair coloring services with premium products.', 120, 80.00, 4, 'http://beautywellness.com/book/hair-coloring');`,

  // Insert into Events
  `INSERT INTO Events (name, description, price, image_url, booking_link)
  VALUES
  ('Summer Glow Workshop', 'Learn skincare routines for radiant summer skin.', 49.99, 'http://example.com/images/event_summer_glow.jpg', 'http://beautywellness.com/book/event/summer-glow'),
  ('Wellness Retreat Weekend', 'A weekend of relaxation and rejuvenation.', 299.99, 'http://example.com/images/event_retreat.jpg', 'http://beautywellness.com/book/event/wellness-retreat');`,

  // Insert into Courses
  `INSERT INTO Courses (name, description, price, schedule, image_url, booking_link)
  VALUES
  ('Advanced Facial Techniques', 'Enhance your skills in facial treatments.', 199.99, '2024-12-05 09:00:00', 'http://example.com/images/course_facial_techniques.jpg', 'http://beautywellness.com/book/course/advanced-facial'),
  ('Massage Therapy Certification', 'Become a certified massage therapist.', 499.99, '2025-01-15 10:00:00', 'http://example.com/images/course_massage_certification.jpg', 'http://beautywellness.com/book/course/massage-certification');`,

  // Insert into ProductReviews
  `INSERT INTO ProductReviews (user_id, product_id, rating, review_text)
  VALUES
  (2, 1, 5, 'This hydrating cream has transformed my skin! Highly recommend.'),
  (3, 2, 4, 'Great shampoo with a pleasant scent. Leaves my hair soft.');`,

  // Insert into PageReviews
  `INSERT INTO PageReviews (rating, review_text)
  VALUES
  (5, 'Amazing services and friendly staff! My skin has never felt better.'),
  (4, 'Great place to relax and rejuvenate, though a bit pricey.');`,
];

// Main Function to Create Database, Tables, and Insert Data
async function createDatabase() {
  let connection;

  try {
    // 1. Connect to MySQL server (without specifying a database)
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true, // To allow executing multiple SQL statements at once
    });

    console.log("Connected to MySQL server.");

    // 2. Drop the existing database if it exists
    await connection.query(`DROP DATABASE IF EXISTS \`${databaseName}\`;`);
    console.log(`Dropped database if it existed: ${databaseName}`);

    // 3. Create the new database
    await connection.query(
      `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`Created new database: ${databaseName}`);

    // 4. Connect to the newly created database
    await connection.changeUser({ database: databaseName });
    console.log(`Switched to database: ${databaseName}`);

    // 5. Create Tables
    for (const query of tableCreationQueries) {
      await connection.query(query);
      console.log(`Executed table creation query.`);
    }
    console.log("All tables created successfully.");

    // 6. Insert Dummy Data
    for (const query of insertDataQueries) {
      await connection.query(query);
      console.log(`Inserted data into tables.`);
    }
    console.log("Dummy data inserted successfully.");

    console.log("Database setup completed successfully.");
  } catch (error) {
    console.error("Error during database setup:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("MySQL connection closed.");
    }
  }
}

// Execute the main function
createDatabase();
