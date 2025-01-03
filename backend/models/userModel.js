import db from "../config/database.js";

/**
 * Fetch all products from the database.
 * @returns {Promise<Array>} An array of products.
 */

export const getUserByEmail = async (email) => {
  try {
    const [rows] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (error) {
    console, error("Error fethcing user by Email:", error);
  }
};

export const getUserById = async (id) => {
  try {
    const [rows] = await db.query("SELECT * FROM Users WHERE user_id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    throw err;
  }
};

export const createUser = async (userData) => {
  const { role, first_name, last_name, email, password, phone } = userData;
  try {
    const [result] = await db.query(
      "INSERT INTO Users (role, first_name, last_name, email, password, phone) VALUES (?,?,?,?,?,?)",
      [role, first_name, last_name, email, password, phone]
    );

    // Return the newly created category ID or some acknowledgment
    return { id: result.insertId, ...userData };
  } catch (err) {
    console.error("Error creating User:", err);
    throw err;
  }
};

export const updateUser = async (id, userData) => {
  const { role, first_name, last_name, email, password, phone } = userData;

  try {
    const [result] = await db.query(
      "UPDATE Users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE user_id = ?",
      [
        first_name,
        last_name,
        email,
        phone,
        id, // ID of the user to update
      ]
    );

    if (result.affectedRows === 0) {
      return null; // No user was updated
    }

    return { user_id: id, ...userData }; // Return updated user data
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
};

export const deleteUser = async (id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // Delete associated profiles
    await connection.query("DELETE FROM Profile WHERE user_id = ?", [id]);
    // Delete the category
    const [result] = await connection.query(
      "DELETE FROM Users WHERE user_id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return null;
    }
    await connection.commit();
    return { message: "User deleted successfully" };
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting User:", err);
    throw err;
  } finally {
    connection.release();
  }
};
