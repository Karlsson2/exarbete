// server.js
import express from "express";
import cors from "cors";
import path from "path";
import Stripe from "stripe";
import { fileURLToPath } from "url";
import { dirname } from "path";
import upload from "./config/uploadConfig.js";
import adminMiddleware from "./middleware/adminMiddleware.js";
import authMiddleware from "./middleware/authMiddleware.js";
import {
  showEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "./controllers/event.js";
import {
  GetProductById,
  showProducts,
  showallProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCheckoutProducts,
  showFeaturedProducts,
} from "./controllers/product.js";
import {
  showCourses,
  createNewCourse,
  updateCourseById,
  deleteCourseById,
} from "./controllers/course.js";
import {
  showServices,
  createNewService,
  updateServiceById,
  deleteServiceById,
} from "./controllers/service.js";
import {
  showServicesCategories,
  createNewServicesCategories,
  updateServicesCategoriesById,
  deleteServicesCategoriesById,
} from "./controllers/servicescategories.js";
import {
  showBrands,
  createNewBrand,
  updateBrandById,
  deleteBrandById,
} from "./controllers/brand.js";
import {
  showPageReviews,
  createNewPageReviews,
  updatePageReviewsById,
  deletePageReviewsById,
} from "./controllers/pagereview.js";
import {
  showProductReviews,
  showProductReviewsById,
  deleteProductReviewsById,
  updateProductReviewById,
} from "./controllers/productreview.js";
import dotenv from "dotenv";
import multer from "multer"; // <-- Import multer
import {
  showUserById,
  updateUserById,
  createNewUser,
  deleteUserById,
} from "./controllers/user.js";
import {
  showCategories,
  deleteCategoriesById,
  updateCategoriesById,
  createNewCategories,
} from "./controllers/categories.js";

import { loginUser, registerUser } from "./controllers/authentication.js";
import {
  createOrderByHook,
  createNewOrder,
  deleteOrderById,
  showOrders,
  updateOrderById,
  showOrdersById,
  showOrderByUserId,
} from "./controllers/order.js";
import { sendCode, resetPassword } from "./controllers/reset-password.js";
import { getOrderById } from "./models/orderModel.js";
import {
  createNewProperty,
  deletePropertyById,
  showProperties,
  updatePropertyById,
} from "./controllers/productproperties.js";
import {
  showStockQuantity,
  updateStock,
} from "./controllers/stock-quantity.js";

import {
  sendOrderEmails,
  sendUpdateEmail,
} from "./controllers/sendOrderEmails.js";
import { sendContactForm } from "./controllers/sendContactForm.js";
import { addToNewsletter } from "./controllers/sendOrderEmails.js";

dotenv.config();
const app = express();
const PORT = 3000;

// Middleware

app.options("*", cors()); // Allow preflight requests for all routes
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

async function getCheckoutSession(sessionId) {
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
  return lineItems;
}

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const YOUR_DOMAIN = process.env.FRONTEND_URL; //

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;
    try {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Error verifying webhook signature:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Acknowledge the webhook quickly
    res.sendStatus(200);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Move the rest to a background process
      (async () => {
        try {
          const shippingAddress = session.customer_details.address;
          const email = session.customer_details.email;
          const totalCost = session.amount_total / 100;
          const items = await getCheckoutSession(session.id);
          const lineItems = await stripe.checkout.sessions
            .listLineItems(session.id, {
              expand: ["data.price.product"],
            })
            .catch((error) => {
              console.error("Error fetching line items: ", error);
              return []; // Return empty array if there's an error
            });
          const user_id = session.metadata.user_id;

          if (!lineItems || lineItems.data.length === 0) {
            console.error("No line items found.");
            return; // Prevent further execution if no line items
          }
          // Capture the order details, including order_id
          const { order_id } = await createOrderByHook(
            user_id,
            lineItems,
            shippingAddress,
            totalCost
          );

          // Pass order_id to sendOrderEmails
          await updateStock(lineItems); // Pass the correctly populated lineItems
          await sendOrderEmails(order_id, email);
          await sendUpdateEmail();
        } catch (error) {
          console.error("Error creating order: ", error);
        }
      })();
    }
  }
);

app.use(express.json());

app.post("/create-checkout-session", cors(), async (req, res) => {
  try {
    const { dummyItems } = req.body; // Destructure to easily access line_items
    const { user_id } = req.body;
    const line_items = await getCheckoutProducts(res, dummyItems);
    // Ensure line_items is an array and has at least one item
    if (!Array.isArray(dummyItems) || line_items.length === 0) {
      return res.status(400).send("Invalid or missing line items");
    }
    console.log("user_id", user_id);
    console.log("dummyItems", dummyItems);
    console.log("line_items", line_items);

    // Create a checkout session with all the line items
    const session = await stripe.checkout.sessions.create({
      line_items, // Pass the entire line_items array
      mode: "payment",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["SE"],
      },
      metadata: {
        user_id: user_id,
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 4500,
              currency: "sek",
            },
            display_name: "Standard Frakt",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 1,
              },
              maximum: {
                unit: "business_day",
                value: 1,
              },
            },
          },
        },

        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "sek",
            },
            display_name: "Hämta i butik (Gratis)",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 5,
              },
              maximum: {
                unit: "business_day",
                value: 7,
              },
            },
          },
        },
      ],

      locale: "sv",
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}`,
    });
    // Set CORS header and respond with the session URL
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.status(303).json({ url: session.url });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error); // More detailed error log
    res.status(500).send("Error creating Stripe checkout session");
  }
});

app.get("/api/get-session-details", async (req, res) => {
  const { session_id } = req.query;

  try {
    // Fetch the session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    // Get the user ID from the session metadata
    const user_id = session.metadata.user_id;

    // Fetch the order details by user ID
    const order = await showOrderByUserId(user_id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Send back order details
    res.status(200).json(order);
  } catch (error) {
    console.error("Error in /api/get-session-details:", error);
    res.status(500).json({ error: "Unable to fetch session details" });
  }
});

// Handle __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirnameFull = dirname(__filename);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirnameFull, "uploads")));

// Routes for productSizes / stock_quantity for each size
app.get("/update-stock", showStockQuantity); // Get all productSizes

// Routes for Products
app.get("/products", showProducts); // Get all products
app.get("/allproducts", showallProducts); // Get all products with additional info
app.get("/admin/products", authMiddleware, adminMiddleware, showProducts); // Get all products for admin
app.get("/featuredproducts", showFeaturedProducts);
app.post(
  "/admin/products",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "secondaryImage", maxCount: 1 },
    { name: "thirdImage", maxCount: 1 },
  ]),
  createProduct
); // Create a new product
app.put(
  "/admin/products/:id",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "secondaryImage", maxCount: 1 },
    { name: "thirdImage", maxCount: 1 },
  ]),
  updateProduct
); // Update a product
app.delete(
  "/admin/products/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  deleteProduct
); // Delete a product

app.get("/categories", showCategories); // Get all product Categories
app.post("/categories", authMiddleware, adminMiddleware, createNewCategories); // Create
app.put(
  "/categories/:id",
  authMiddleware,
  adminMiddleware,
  updateCategoriesById
); // Update
app.delete(
  "/categories/:id",
  authMiddleware,
  adminMiddleware,
  deleteCategoriesById
); // Delete

// Route for newsletter
app.post("/newsletter", addToNewsletter);

// Routes for Courses
app.get("/courses", showCourses); // Get all courses
app.post(
  "/courses",
  authMiddleware,
  adminMiddleware,
  upload.single("courseImage"),
  createNewCourse
); // Create a new course with image upload
app.put(
  "/courses/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("courseImage"),
  updateCourseById
); // Update a course with image upload
app.delete("/courses/:id", authMiddleware, adminMiddleware, deleteCourseById); // Delete a course

// Routes for events with image upload
app.get("/events", showEvents);
app.get("/admin/events", authMiddleware, adminMiddleware, showEvents);
app.post(
  "/admin/events",
  authMiddleware,
  adminMiddleware,
  upload.single("eventImage"),
  createEvent
); // Added image upload to events
app.put(
  "/admin/events/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("eventImage"),
  updateEvent
); // Added image upload to events
app.delete("/admin/events/:id", authMiddleware, adminMiddleware, deleteEvent);

app.get("/orders", authMiddleware, adminMiddleware, showOrders); // Get all the orders
app.post("/orders", authMiddleware, adminMiddleware, createNewOrder); // Create orders
app.put("/orders/:id", authMiddleware, adminMiddleware, updateOrderById); // update a specific order
app.delete("/orders/:id", authMiddleware, adminMiddleware, deleteOrderById); // delete a specific order
app.get("/ordersByUser/", authMiddleware, showOrdersById); // Get all the orders by user

// Auth Routes
app.post("/login", loginUser);
app.post("/register", registerUser);

// Routes for Services
app.get("/services", showServices); // Get all courses
app.post(
  "/services",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "beforeImage", maxCount: 1 },
    { name: "afterImage", maxCount: 1 },
  ]),
  createNewService
);
app.put(
  "/services/:id",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "beforeImage", maxCount: 1 },
    { name: "afterImage", maxCount: 1 },
  ]),
  updateServiceById
);
app.delete("/services/:id", authMiddleware, adminMiddleware, deleteServiceById); // Delete a service

//Routes for ServicesCategories
app.get("/services-categories", showServicesCategories); // Get all Servicescategories
app.post(
  "/services-categories",
  authMiddleware,
  adminMiddleware,
  createNewServicesCategories
); // Create
app.put(
  "/services-categories/:id",
  authMiddleware,
  adminMiddleware,
  updateServicesCategoriesById
); // Update
app.delete(
  "/services-categories/:id",
  authMiddleware,
  adminMiddleware,
  deleteServicesCategoriesById
); // Delete

//Routes for Brands
app.get("/brands", showBrands); // Get all Servicescategories
app.post("/brands", authMiddleware, adminMiddleware, createNewBrand); // Create
app.put("/brands/:id", authMiddleware, adminMiddleware, updateBrandById); // Update
app.delete("/brands/:id", authMiddleware, adminMiddleware, deleteBrandById); // Delete

//Routes for PageReviews
app.get("/page-reviews", showPageReviews); // Get all PageReviews
app.post(
  "/page-reviews",
  authMiddleware,
  adminMiddleware,
  createNewPageReviews
); // Create
app.put(
  "/page-reviews/:id",
  authMiddleware,
  adminMiddleware,
  updatePageReviewsById
); // Update
app.delete(
  "/page-reviews/:id",
  authMiddleware,
  adminMiddleware,
  deletePageReviewsById
); // Delete

//Routes for ProductReviews
app.get(
  "/product-reviews",
  authMiddleware,
  adminMiddleware,
  showProductReviews
); // Get all ProductReviews
app.put(
  "/product-reviews/:id",
  authMiddleware,
  adminMiddleware,
  updateProductReviewById
);
app.delete(
  "/product-reviews/:id",
  authMiddleware,
  adminMiddleware,
  deleteProductReviewsById
);

// Routes for resetting password.
app.post("/forgot-password", sendCode);
app.post("/reset-password/:token", resetPassword);

// Routes for sending messafe through contact form.
app.post("/contactform", sendContactForm);

//Routes for User
app.get("/user/:id", showUserById); // Get all User
app.post("/user", createNewUser); // Create
app.put("/user/:id", authMiddleware, updateUserById); // Update
app.delete("/user/:id", authMiddleware, adminMiddleware, deleteUserById); // Delete

// Routes for singular Product
app.get("/product/:id", GetProductById);

// Routes for product Properties
app.get("/productproperties", showProperties);
app.post(
  "/productproperties",
  authMiddleware,
  adminMiddleware,
  createNewProperty
);
app.delete(
  "/productproperties/:id",
  authMiddleware,
  adminMiddleware,
  deletePropertyById
);
app.put(
  "/productproperties/:id",
  authMiddleware,
  adminMiddleware,
  updatePropertyById
);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Express Error:", err.message);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }

  next();
});

// Handle Unhandled Rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Optionally, exit the process or perform other cleanup
  // process.exit(1);
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
