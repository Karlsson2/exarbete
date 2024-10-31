import db from "../config/database.js";

/**
 * Fetch all products from the database.
 * @returns {Promise<Array>} An array of products.
 */
export const getProducts = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM Products");
    return rows;
  } catch (err) {
    console.error("Error fetching products:", err);
    throw err; // Propagate the error to be handled by the controller
  }
};

export const insertProduct = async (product) => {
  const {
    product_name,
    description,
    sizes, // Assuming this is an array of objects
    category_id,
    image_url_primary,
    image_url_secondary,
    image_url_third,
  } = product;

  try {
    // Step 1: Insert into the Products table
    const productQuery = `
      INSERT INTO Products (product_name, description, category_id, image_url_primary, image_url_secondary, image_url_third)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [productResult] = await db.query(productQuery, [
      product_name,
      description,
      category_id,
      image_url_primary,
      image_url_secondary,
      image_url_third,
    ]);

    const productId = productResult.insertId;

    // Step 2: Insert sizes into the ProductSizes table
      const sizeValues = sizes.map(({ sizeName, price, quantity }) => 
        `(${productId}, '${sizeName}', ${price}, ${quantity})`
      ).join(", ");

    const sizeQuery = `
      INSERT INTO ProductSizes (product_id, size, price, stock_quantity)
      VALUES ${sizeValues}
    `;

    await db.query(sizeQuery); // Execute the insert query

    return productResult;
  } catch (err) {
    console.error("Error inserting product and sizes:", err);
    throw err;
  }
};

export const editProduct = async (product) => {
  const {
    product_id,
    product_name,
    description,
    variants, // Array of size objects with sizeName, price, and quantity
    category_id,
    image_url_primary,
    image_url_secondary,
    image_url_third,
  } = product;

  try {
    const productQuery = `
      UPDATE Products
      SET product_name = ?, description = ?, category_id = ?, image_url_primary = ?, image_url_secondary = ?, image_url_third = ?
      WHERE product_id = ?
    `;
    await db.query(productQuery, [
      product_name,
      description,
      category_id,
      image_url_primary,
      image_url_secondary,
      image_url_third,
      product_id,
    ]);

    const deleteSizesQuery = `
      DELETE FROM ProductSizes WHERE product_id = ?
    `;
    await db.query(deleteSizesQuery, [product_id]);

    const sizeValues = variants.map(({ size, price, stock_quantity }) => 
      `(${product_id}, '${size}', ${price}, ${stock_quantity})`
    ).join(", ");

    if (variants.length > 0) {
      const insertSizesQuery = `
        INSERT INTO ProductSizes (product_id, size, price, stock_quantity)
        VALUES ${sizeValues}`;
      await db.query(insertSizesQuery);
    }

    return { success: true, message: "Product and sizes updated successfully" };
  } catch (err) {
    console.error("Error updating product and sizes:", err);
    throw err;
  }
};

/**
 * Delete a product from the database.
 * @param {number} productId - The ID of the product to be deleted.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const trashProduct = async (productId) => {
  try {
    // Delete from ProductSizes first
    const querySizes = `DELETE FROM ProductSizes WHERE product_id = ?`;
    const [resultSizes] = await db.query(querySizes, [productId]);

    // Then delete from Products
    const queryProducts = `DELETE FROM Products WHERE product_id = ?`;
    const [resultProducts] = await db.query(queryProducts, [productId]);

    return {
      sizesDeleted: resultSizes,
      productDeleted: resultProducts,
    };
  } catch (err) {
    console.error("Error deleting product:", err);
    throw err; // Propagate the error to be handled by the controller
  }
};


// Fetch products and their prices by product IDs
export const fetchProductsByIds = async (productIds) => {
  const query = `SELECT id, price FROM Products WHERE id = ANY(?)`;
  const { rows } = await db.query(query, [productIds]);
  return rows;
};

export const fetchCheckoutProductsByIds = async (items) => {
  // Construct conditions from items to filter by specific (product_id, size_id) pairs
  const conditions = items
    .map((item) => `(${item.product_id}, ${item.size_id})`)
    .join(", ");

  // Use a SQL query to join Products and ProductSizes based on these pairs
  const query = `
    SELECT 
      Products.product_id, 
      Products.product_name, 
      ProductSizes.size_id, 
      ProductSizes.size, 
      ProductSizes.price 
    FROM 
      Products
    INNER JOIN 
      ProductSizes ON Products.product_id = ProductSizes.product_id
    WHERE 
      (Products.product_id, ProductSizes.size_id) IN (${conditions})
  `;

  // Execute the query
  const [rows] = await db.query(query);
  return rows;
};

export const getProductsWithInfo = async () => {
  const [rows] = await db.query(`
  
    SELECT 
    p.product_id,
    p.product_name,
    p.description,
    p.created_at,
    p.image_url_primary,
    p.image_url_secondary,
    p.image_url_third,
    JSON_OBJECT(
        'category_id', c.category_id,
        'category_name', c.category_name,
        'parent_category_id', c.parent_category_id
    ) AS category,
    JSON_ARRAYAGG(
        CASE 
            WHEN ps.size_id IS NOT NULL THEN JSON_OBJECT(
                'size_id', ps.size_id,
                'size', ps.size,
                'price', ps.price,
                'stock_quantity', ps.stock_quantity
            )
        END
    ) AS variants
FROM 
    Products p
LEFT JOIN
    Categories c ON p.category_id = c.category_id
LEFT JOIN 
    ProductSizes ps ON p.product_id = ps.product_id
GROUP BY 
    p.product_id;

  `);

  // Post-process the rows to ensure variants is an empty object if there are no sizes
  return rows.map((row) => {
    // Check if variants is an empty array or undefined, and set to empty object
    if (!row.variants || row.variants.length === 0) {
      row.variants = {}; // Set to empty object if there are no variants
    }
    return row;
  });
};

// Fetch a single product and its price by product ID
export const getProductById = async (productId) => {
  // Query to get product details
  const productQuery = `
    SELECT 
      p.product_id, 
      p.product_name, 
      p.description, 
      p.image_url_primary,
      p.image_url_secondary,
      p.image_url_third,
      p.category_id,
      c.category_name
    FROM Products p
    INNER JOIN Categories c ON p.category_id = c.category_id
    WHERE p.product_id = ? 
    LIMIT 1
  `;

  // Query to get the product sizes
  const sizesQuery = `
    SELECT 
      size_id,
      product_id,
      size AS sizeName,
      price,
      stock_quantity AS quantity
    FROM ProductSizes
    WHERE product_id = ?
  `;

  try {
    // Fetch product information
    const [productRows] = await db.query(productQuery, [productId]);
    const product = productRows[0];

    if (!product) {
      return null; // Product not found
    }

    // Fetch associated sizes for the product
    const [sizeRows] = await db.query(sizesQuery, [productId]);

    // Combine product details with sizes array
    return { 
      ...product, 
      variants: sizeRows 
    };
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    throw err;
  }
};

