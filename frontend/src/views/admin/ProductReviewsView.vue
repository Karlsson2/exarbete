<template>
  <div class="page-reviews-container">
    <router-link to="/admin" class="back"
      ><font-awesome-icon icon="chevron-left" /> Tillbaka</router-link
    >
    <h1>Produkt recensioner</h1>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <div class="form-container" ref="formContainer">
      <h2>{{ isEditing ? "Ändra Review" : "Lägg till ny REVIEW" }}</h2>
      <form
        @submit.prevent="isEditing ? updateReview() : addReview()"
        enctype="multipart/form-data"
      >
        <!-- Name -->
        <div class="form-group">
          <label for="rating">Rating:</label>
          <input
            v-model="form.rating"
            type="number"
            id="rating"
            required
            placeholder="1-5"
            max="5"
            min="1"
            step="1"
          />
        </div>
        <!-- Name -->
        <div class="form-group">
          <label for="name">Recensions text:</label>
          <input
            v-model="form.review_text"
            type="text"
            id="review_text"
            placeholder="i really liked the salon!"
            required
          />
        </div>

        <!-- Buttons -->
        <div class="button-group">
          <button type="submit">
            {{ isEditing ? "Updatera" : "Lägg till" }} Recension
          </button>
          <button type="button" v-if="isEditing" @click="cancelEdit">
            Avbryt
          </button>
        </div>
      </form>
    </div>

    <!-- Review List -->
    <div class="list-container">
      <h2>Alla Produkt Recensioner</h2>
      <table>
        <thead>
          <tr>
            <th>Rating</th>
            <th>Recensions Text</th>
            <th>Produkt ID</th>
            <th>Skriven av</th>
            <th>Åtgärder</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="review in reviews" :key="review.id">
            <td>{{ review.rating }}</td>
            <td>{{ review.review_text }}</td>
            <td>{{ review.product_id }}</td>
            <td>{{ review.user_id }}</td>
            <td>
              <button @click="editReview(review)">
                <font-awesome-icon :icon="['fas', 'edit']" />
              </button>
              <button @click="deleteReview(review.id)">
                <font-awesome-icon :icon="['fas', 'trash']" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import axiosInstance from "@/services/axiosConfig";
import Swal from "sweetalert2";

export default {
  name: "ProductReviewView",
  data() {
    return {
      reviews: [],
      form: {
        id: null, // Used for editing
        rating: null,
        review_text: "",
      },
      isEditing: false,
      isLoading: false, // For loading indicator
    };
  },
  created() {
    this.fetchProductReviews();
  },
  methods: {
    /**
     * Fetch all categories from the backend.
     */
    async fetchProductReviews() {
      this.isLoading = true;
      try {
        const response = await axiosInstance.get(`/product-reviews`);
        this.reviews = response.data.map((review) => ({
          ...review,
        }));
      } catch (error) {
        console.error(
          "Error fetching Page Reviews:",
          error.response || error.message
        );
        Swal.fire(
          "Error",
          "Failed to fetch Page Reviews. Please try again later.",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Add a new review
     */
    async addReview() {
      try {
        this.isLoading = true;
        const response = await axiosInstance.post(`/page-reviews`, {
          rating: this.form.rating,
          review_text: this.form.review_text,
        });

        const addedReview = { ...response.data };
        this.reviews.push(addedReview);
        this.resetForm();
        Swal.fire("Success", "Review added successfully!", "success");
      } catch (error) {
        console.error("Error adding review:", error.response || error.message);
        Swal.fire(
          "Error",
          "Failed to add review. Please check your input and try again.",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Prepare to edit a review by pre-filling the form.
     */
    editReview(review) {
      this.isEditing = true;
      this.form.rating = review.rating;
      this.form.review_text = review.review_text;
      this.form.id = review.id;
      this.$nextTick(() => {
        this.$refs.formContainer.scrollIntoView({ behavior: "smooth" });
      });
    },

    /**
     * Update an existing review
     */
    async updateReview() {
      try {
        this.isLoading = true;

        // Send the data as JSON
        const response = await axiosInstance.put(
          `/product-reviews/${this.form.id}`,
          {
            rating: this.form.rating,
            review_text: this.form.review_text,
          }
        );

        const updatedReviewData = { ...response.data };

        // Update the categories array with the new data
        const index = this.reviews.findIndex((c) => c.id === this.form.id);
        if (index !== -1) {
          this.reviews.splice(index, 1, updatedReviewData);
        }

        this.resetForm();
        this.isEditing = false;
        Swal.fire("Success", "Review updated successfully!", "success");
      } catch (error) {
        console.error(
          "Error updating review:",
          error.response || error.message
        );
        Swal.fire(
          "Error",
          "Failed to update review. Please check your input and try again.",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Delete a review.
     */
    async deleteReview(id) {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Vill du verkligen ta bort den här reviewen? Detta kan inte ångras.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });

      // Check if the user confirmed the action
      if (!result.isConfirmed) return;

      try {
        this.isLoading = true;
        await axiosInstance.delete(`/product-reviews/${id}`);
        this.reviews = this.reviews.filter((review) => review.id !== id);
        Swal.fire("Deleted!", "REVIEW deleted successfully!", "success");
      } catch (error) {
        console.error(
          "Error deleting review:",
          error.response || error.message
        );
        Swal.fire(
          "Error",
          "Failed to delete review. Please try again later.",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Reset the form fields and clear image selections.
     */
    resetForm() {
      // Maintain review_id if editing
      const previousReviewId = this.isEditing ? this.form.id : null;

      this.form = {
        id: previousReviewId, // Keep the previous review ID
        rating: null,
        review_text: "",
      };
    },

    /**
     * Cancel editing and reset the form.
     */
    cancelEdit() {
      this.resetForm();
      this.isEditing = false;
    },
  },
};
</script>

<style scoped>
.page-reviews-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: #555;
}

h1 {
  color: #333;
}

h1,
h2 {
  text-align: center;
  margin-bottom: 20px;
}

.form-container,
.list-container {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 40px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.form-group label {
  width: 150px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.button-group {
  display: flex;
  justify-content: flex-start;
}

.button-group button {
  margin-right: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button-group button[type="submit"] {
  background-color: #28a745;
  color: #fff;
}

.button-group button[type="button"] {
  background-color: #6c757d;
  color: #fff;
}

.button-group button:hover {
  opacity: 0.9;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

thead {
  background-color: #f8f9fa;
}

th,
td {
  padding: 12px;
  border: 1px solid #dee2e6;
  text-align: left;
  word-wrap: break-word;
}

th {
  font-weight: bold;
}

#schedule {
  flex: 0;
}

a {
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  padding: 6px 12px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:first-of-type {
  background-color: #007bff;
  color: #fff;
}

button:last-of-type {
  background-color: #dc3545;
  color: #fff;
}

button:hover {
  opacity: 0.8;
}

/* Loading Indicator Styles */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  border: 8px solid #f3f3f3;
  border-top: 8px solid #007bff;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Image Preview Styles */
.image-preview {
  width: 150px;
  height: auto;
  margin-top: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
tr:nth-child(2n) {
  background-color: #f8f8f8; /* Light gray background for every second td */
}

/* Responsive Design */
@media (max-width: 768px) {
  h1 {
    margin-top: 31px;
    font-size: 1.5em;
  }
  h2 {
    font-size: 1.3em;
  }
  .form-group {
    flex-direction: column;
    align-items: flex-start;
  }
  .form-group input,
  .form-group textarea {
    width: 100%;
  }
  #schedule {
    width: fit-content;
  }
  .form-group label {
    width: 100%;
    margin-bottom: 5px;
  }

  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
  }

  th {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }

  tr {
    margin-bottom: 15px;
  }

  td {
    position: relative;
    padding-left: 50%;
    border: none;
    border-bottom: 1px solid #dee2e6;
  }

  td::before {
    position: absolute;
    top: 12px;
    left: 12px;
    width: 45%;
    padding-right: 10px;
    white-space: nowrap;
    font-weight: bold;
  }

  td:nth-of-type(1)::before {
    content: "Kategori Namn";
  }
  td:nth-of-type(2)::before {
    content: "Åtgärder";
  }
}
</style>
