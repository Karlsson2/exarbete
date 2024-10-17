<template>
  <div class="service-categories-container">
    <h1>Behandlings Kategorier</h1>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <!-- Add/Edit ServiceCategory Form -->
    <div class="form-container" ref="formContainer">
      <h2>{{ isEditing ? "Ändra Kategori" : "Lägg till ny Kategori" }}</h2>
      <form
        @submit.prevent="isEditing ? updateCategory() : addCategory()"
        enctype="multipart/form-data"
      >
        <!-- Name -->
        <div class="form-group">
          <label for="name">Namn:</label>
          <input v-model="form.name" type="text" id="name" required />
        </div>

        <!-- Buttons -->
        <div class="button-group">
          <button type="submit">
            {{ isEditing ? "Updatera" : "Lägg till" }} Kategori
          </button>
          <button type="button" v-if="isEditing" @click="cancelEdit">
            Avbryt
          </button>
        </div>
      </form>
    </div>

    <!-- Category List -->
    <div class="list-container">
      <h2>Alla Kategorier</h2>
      <table>
        <thead>
          <tr>
            <th>Kategorinamn</th>
            <th>Åtgärder</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.category_id">
            <td>{{ category.category_name }}</td>
            <td>
              <button @click="editCategory(category)">Edit</button>
              <button @click="deleteCategory(category.category_id)">
                Delete
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
  name: "CategoryView",
  data() {
    return {
      categories: [],
      services: [],
      form: {
        category_id: null, // Used for editing
        name: "", // This field will be populated with category name during edit
      },
      isEditing: false,
      isLoading: false, // For loading indicator
    };
  },
  computed: {
    API_BASE_URL() {
      const url = process.env.VUE_APP_API_BASE_URL || "http://localhost:3000";
      return url;
    },
  },
  created() {
    this.fetchCategories();
    this.fetchServices();
  },
  methods: {
    /**
     * Fetch all categories from the backend.
     */
    async fetchCategories() {
      this.isLoading = true;
      try {
        const response = await axiosInstance.get(`/services-categories`);
        this.categories = response.data.map((category) => ({
          ...category,
        }));
      } catch (error) {
        console.error(
          "Error fetching categories:",
          error.response || error.message
        );
        Swal.fire(
          "Error",
          "Failed to fetch categories. Please try again later.",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Fetch all services from the backend.
     */
    async fetchServices() {
      this.isLoading = true;
      try {
        const response = await axiosInstance.get(`/services`);
        this.services = response.data.map((service) => ({
          ...service,
          price: Number(service.price), // Ensure 'price' is a number
        }));
      } catch (error) {
        console.error(
          "Error fetching services:",
          error.response || error.message
        );
        Swal.fire(
          "Fel",
          "Fel vid hämtning av behandlingar: Misslyckades med att hämta behandlingar. Försök igen senare",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Add a new category with image upload.
     */
    async addCategory() {
      try {
        this.isLoading = true;
        const response = await axiosInstance.post(`/services-categories`, {
          category_name: this.form.name,
        });

        const addedCategory = { ...response.data };
        this.categories.push(addedCategory);
        this.resetForm();
        Swal.fire("Success", "Category added successfully!", "success");
      } catch (error) {
        console.error(
          "Error adding category:",
          error.response || error.message
        );
        Swal.fire(
          "Error",
          "Failed to add category. Please check your input and try again.",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Prepare to edit a category by pre-filling the form.
     */
    editCategory(category) {
      this.isEditing = true;
      this.form.name = category.category_name;
      this.form.category_id = category.category_id;
      this.$nextTick(() => {
        this.$refs.formContainer.scrollIntoView({ behavior: "smooth" });
      });
    },

    /**
     * Update an existing category
     */
    async updateCategory() {
      try {
        this.isLoading = true;

        // Send the data as JSON
        const response = await axiosInstance.put(
          `/services-categories/${this.form.category_id}`,
          {
            category_name: this.form.name,
          }
        );

        const updatedCategoryData = { ...response.data };

        // Update the categories array with the new data
        const index = this.categories.findIndex(
          (c) => c.category_id === this.form.category_id
        );
        if (index !== -1) {
          this.categories.splice(index, 1, updatedCategoryData);
        }

        this.resetForm();
        this.isEditing = false;
        Swal.fire("Success", "Category updated successfully!", "success");
      } catch (error) {
        console.error(
          "Error updating category:",
          error.response || error.message
        );
        Swal.fire(
          "Error",
          "Failed to update category. Please check your input and try again.",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Delete a category.
     */
    async deleteCategory(category_id) {
      const filteredServices = this.services.filter(
        (service) => service.category_id === category_id
      );

      const result = await Swal.fire({
        title: "Are you sure?",
        text:
          "Vill du verkligen ta bort den här kategorien? Detta kan inte ångras. Behandlingarna nedan kommer också att tas bort om du tar bort kategorien: " +
          filteredServices.map((service) => service.name),
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
        await axiosInstance.delete(`/services-categories/${category_id}`);
        this.categories = this.categories.filter(
          (category) => category.category_id !== category_id
        );
        Swal.fire("Deleted!", "Category deleted successfully!", "success");
      } catch (error) {
        console.error(
          "Error deleting category:",
          error.response || error.message
        );
        Swal.fire(
          "Error",
          "Failed to delete category. Please try again later.",
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
      // Maintain category_id if editing
      const previousCategoryId = this.isEditing ? this.form.category_id : null;

      this.form = {
        category_id: previousCategoryId, // Keep the previous category ID
        name: "",
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
.service-category-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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
