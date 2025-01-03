import db from "../config/database.js";

/**
 * Fetch all products from the database.
 * @returns {Promise<Array>}
 */
export const getProducts = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM Products");
    return rows;
  } catch (err) {
    console.error("Error fetching products:", err);
    throw err;
  }
};

export const getFeaturedProducts = async () => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.usage_products,
        p.ingredients,
        p.featured,
        p.created_at,
        p.brand_id,
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
                ELSE NULL
            END
        ) AS variants,
        (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'property_id', pp.property_id,
                    'name', pp.name
                )
            ) FROM ProductPropertiesJoinTable ppjt
            INNER JOIN ProductProperties pp ON ppjt.property_id = pp.property_id
            WHERE ppjt.product_id = p.product_id) AS properties
      FROM 
        Products p
      LEFT JOIN
        Categories c ON p.category_id = c.category_id
      LEFT JOIN 
        ProductSizes ps ON p.product_id = ps.product_id
      WHERE 
        p.featured = 1
      GROUP BY 
        p.product_id;
    `);

    // Post-process the rows to handle empty arrays or objects as needed
    return rows.map((row) => {
      // Set variants to an empty array if it contains only nulls
      row.variants =
        row.variants && row.variants[0] !== null ? row.variants : [];
      row.properties =
        row.properties && row.properties.length > 0 ? row.properties : [];
      return row;
    });
  } catch (err) {
    console.error("Error fetching featured products:", err);
    throw err;
  }
};

export const insertProduct = async (product) => {
  const {
    product_name,
    description,
    variants,
    usage_products,
    ingredients,
    brand_id,
    properties,
    category_id,
    featured,
    image_url_primary,
    image_url_secondary,
    image_url_third,
  } = product;

  try {
    // Check if sizes or properties are missing and throw an error
    if (!variants || variants.length === 0) {
      throw new Error("Product sizes are missing");
    }

    if (!properties || properties.length === 0) {
      throw new Error("Product properties are missing");
    }

    const featuredValue = featured ? 1 : 0;

    const productQuery = `
      INSERT INTO Products (product_name, description, usage_products, ingredients, category_id, brand_id, featured, image_url_primary, image_url_secondary, image_url_third)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [productResult] = await db.query(productQuery, [
      product_name,
      description,
      usage_products,
      ingredients,
      category_id,
      brand_id,
      featuredValue,
      image_url_primary,
      image_url_secondary,
      image_url_third,
    ]);

    const productId = productResult.insertId;

    const sizeValues = variants.map(({ size, price, stock_quantity }) => [
      productId,
      size,
      price,
      stock_quantity,
    ]);

    const sizeQuery = `
      INSERT INTO ProductSizes (product_id, size, price, stock_quantity)
      VALUES ${variants.map(() => "(?, ?, ?, ?)").join(", ")}
    `;
    await db.query(sizeQuery, sizeValues.flat());

    const propertiesValues = properties.map(({ property_id }) => [
      productId,
      property_id,
    ]);

    const propertiesQuery = `
      INSERT INTO ProductPropertiesJoinTable (product_id, property_id)
      VALUES ${properties.map(() => "(?, ?)").join(", ")}
    `;
    await db.query(propertiesQuery, propertiesValues.flat());

    return productResult;
  } catch (err) {
    console.error("Error inserting product, sizes, or properties:", err);

    // Return a specific error message to the frontend
    throw new Error(err.message || "Error inserting product");
  }
};

export const editProduct = async (product) => {
  const {
    product_id,
    product_name,
    description,
    variants,
    usage_products,
    ingredients,
    category_id,
    brand_id,
    featured,
    image_url_primary,
    image_url_secondary,
    image_url_third,
    properties,
  } = product;

  try {
    const productQuery = `
      UPDATE Products
      SET product_name = ?, description = ?, usage_products = ?, ingredients = ?, category_id = ?, brand_id = ?, featured = ?, image_url_primary = ?, image_url_secondary = ?, image_url_third = ?
      WHERE product_id = ?
    `;
    await db.query(productQuery, [
      product_name,
      description,
      usage_products,
      ingredients,
      category_id,
      brand_id,
      featured,
      image_url_primary,
      image_url_secondary,
      image_url_third,
      product_id,
    ]);

    const deleteSizesQuery = `
      DELETE FROM ProductSizes WHERE product_id = ?
    `;
    await db.query(deleteSizesQuery, [product_id]);

    if (variants && variants.length > 0) {
      const sizeValues = variants
        .map(
          ({ size, price, stock_quantity }) =>
            `(${product_id}, '${size}', ${price}, ${stock_quantity})`
        )
        .join(", ");
      const insertSizesQuery = `
        INSERT INTO ProductSizes (product_id, size, price, stock_quantity)
        VALUES ${sizeValues}`;
      await db.query(insertSizesQuery);
    }

    const deletePropertiesQuery = `
      DELETE FROM ProductPropertiesJoinTable WHERE product_id = ?
    `;
    await db.query(deletePropertiesQuery, [product_id]);

    if (properties && properties.length > 0) {
      const propertiesValues = properties
        .map(({ property_id }) => `(${property_id}, ${product_id})`)
        .join(", ");
      const insertPropertiesQuery = `INSERT INTO ProductPropertiesJoinTable (property_id, product_id)
      VALUES ${propertiesValues}`;
      await db.query(insertPropertiesQuery);
    }

    return {
      success: true,
      message: "Product, sizes and properties updated successfully",
    };
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
    const querySizes = `DELETE FROM ProductSizes WHERE product_id = ?`;
    const [resultSizes] = await db.query(querySizes, [productId]);

    const queryProducts = `DELETE FROM Products WHERE product_id = ?`;
    const [resultProducts] = await db.query(queryProducts, [productId]);

    return {
      sizesDeleted: resultSizes,
      productDeleted: resultProducts,
    };
  } catch (err) {
    console.error("Error deleting product:", err);
    throw err;
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
  try {
    const [rows] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.usage_products,
        p.ingredients,
        p.featured,
        p.created_at,
        p.image_url_primary,
        p.image_url_secondary,
        p.image_url_third,
        JSON_OBJECT(
            'category_id', c.category_id,
            'category_name', c.category_name,
            'parent_category_id', c.parent_category_id
        ) AS category,
        JSON_OBJECT(
          'brand_id', b.brand_id,
          'brand_name', b.brand_name
        ) AS brand,
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'size_id', ps.size_id,
                'size', ps.size,
                'price', ps.price,
                'stock_quantity', ps.stock_quantity)
        ) FROM ProductSizes ps WHERE ps.product_id = p.product_id) AS variants,
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'property_id', pp.property_id,
                'name', pp.name
            )
        ) FROM ProductPropertiesJoinTable ppjt
        INNER JOIN ProductProperties pp ON ppjt.property_id = pp.property_id
        WHERE ppjt.product_id = p.product_id) AS properties
      FROM 
        Products p
      LEFT JOIN
        Categories c ON p.category_id = c.category_id
      LEFT JOIN
        Brands b ON p.brand_id = b.brand_id
    `);

    return rows.map((row) => {
      row.variants =
        row.variants && row.variants.length > 0 ? row.variants : {};
      row.properties =
        row.properties && row.properties.length > 0 ? row.properties : {};
      return row;
    });
  } catch (error) {
    console.error("Error fetching product data:", error);
    throw error; // Re-throw or handle as needed
  }
};

// Fetch a single product and its details, including price, sizes, and properties by product ID
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
  p.usage_products,
  p.ingredients,
  p.brand_id,
  p.featured,
  p.category_id,
  c.category_name,
  JSON_OBJECT(
    'brand_id', b.brand_id,
    'brand_name', b.brand_name
  ) AS brand
FROM Products p
INNER JOIN Categories c ON p.category_id = c.category_id
LEFT JOIN Brands b ON p.brand_id = b.brand_id
WHERE p.product_id = ? 
LIMIT 1;

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

  // Query to get the product properties
  const propertiesQuery = `
    SELECT 
      ppjt.property_id,
      pp.name
    FROM ProductPropertiesJoinTable ppjt
    INNER JOIN ProductProperties pp ON ppjt.property_id = pp.property_id
    WHERE ppjt.product_id = ?
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

    // Fetch associated properties for the product
    const [propertyRows] = await db.query(propertiesQuery, [productId]);

    // Combine product details with sizes and properties arrays
    return {
      ...product,
      variants: sizeRows,
      properties: propertyRows,
    };
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    throw err;
  }
};
