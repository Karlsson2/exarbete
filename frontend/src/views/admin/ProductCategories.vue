<template>
  <div class="service-category-container">
    <router-link to="/admin" class="back"
      ><font-awesome-icon icon="chevron-left" /> Tillbaka</router-link
    >
    <h1>Produkt Kategorier</h1>

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
          <input
            v-model="form.name"
            type="text"
            id="name"
            required
            placeholder="Skriv in kategorinamn"
          />
        </div>
        <div class="form-group">
          <label for="name">Huvudkategori:</label>
          <select
            v-model.number="form.parent_category_id"
            name="parent_categoryId"
            id="parent_categoryId"
          >
            <option value="">Ingen Huvudkategori</option>
            <option
              v-for="category in categories"
              :key="category.category_id"
              :value="category.category_id"
            >
              {{ category.category_name }}
            </option>
          </select>
        </div>

        <!-- Buttons -->
        <div class="button-group">
          <button type="submit">
            {{ isEditing ? "Updatera" : "Lägg till" }} Produkt Kategori
          </button>
          <button type="button" v-if="isEditing" @click="cancelEdit">
            Avbryt
          </button>
        </div>
      </form>
    </div>

    <!-- Category List -->
    <div class="list-container">
      <h2>Alla Produkt Kategorier</h2>
      <table>
        <thead>
          <tr>
            <th>Kategorinamn</th>
            <th>Huvudkategori</th>
            <th>Åtgärder</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.category_id">
            <td>{{ category.category_name }}</td>
            <td>
              {{
                category.parent_category_id === null
                  ? "Ingen HuvudKategori"
                  : (
                      categories.find(
                        (cat) => cat.category_id == category.parent_category_id
                      ) || { category_name: "Unknown Category" }
                    ).category_name
              }}
              <input
                type="hidden"
                :value="category.parent_category_id || ''"
                name="parent_category_id"
              />
            </td>

            <td>
              <button @click="editCategory(category)">
                <font-awesome-icon :icon="['fas', 'edit']" />
              </button>
              <button @click="deleteCategory(category.category_id)">
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
  name: "ProductCategoryView",
  data() {
    return {
      categories: [],
      products: [],
      form: {
        category_id: null, // Used for editing
        name: "", // This field will be populated with category name during edit
        parent_category_id: "",
      },
      isEditing: false,
      isLoading: false, // For loading indicator
    };
  },
  created() {
    this.fetchCategories();
    this.fetchProducts();
  },
  methods: {
    /**
     * Fetch all categories from the backend.
     */
    async fetchCategories() {
      this.isLoading = true;
      try {
        const response = await axiosInstance.get(`/categories`);
        this.categories = response.data.map((category) => ({
          ...category,
        }));
      } catch (error) {
        Swal.fire(
          "Error",
          "Kunde inte hämta kategorier. försök igen.",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },
    async fetchProducts() {
      this.isLoading = true;
      try {
        const response = await axiosInstance.get(`/products`);
        this.products = response.data.map((product) => ({
          ...product,
        }));
      } catch (error) {
        Swal.fire("Error", "Kunde inte hämta produkter. försök igen.", "error");
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Add a new category
     */
    async addCategory() {
      try {
        this.isLoading = true;

        // Convert empty string to null for parent_category_id
        const parentCategoryId =
          this.form.parent_category_id === ""
            ? null
            : this.form.parent_category_id;

        const response = await axiosInstance.post(`/categories`, {
          category_name: this.form.name,
          parent_category_id: parentCategoryId, // Send null or valid id
        });

        const addedCategory = { ...response.data };
        this.categories.push(addedCategory);
        this.resetForm();
        Swal.fire("Success", "Kategori tillagd!", "success");
      } catch (error) {
        const errorMessages = error.response.data.errors
          .map((error) => error.msg)
          .join("<br>");

        // Display all error messages in the alert
        Swal.fire(
          "Error",
          `Kategori kunde inte läggas till. Kolla vad du har skrivit in och försök igen! <br> ${errorMessages}`,
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
      this.form.parent_category_id = category.parent_category_id || "";
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

        // Convert empty string to null for parent_category_id
        const parentCategoryId =
          this.form.parent_category_id === ""
            ? null
            : this.form.parent_category_id;

        const response = await axiosInstance.put(
          `/categories/${this.form.category_id}`,
          {
            category_name: this.form.name,
            parent_category_id: parentCategoryId, // Send null or valid id
          }
        );

        const updatedCategoryData = { ...response.data };
        const index = this.categories.findIndex(
          (c) => c.category_id === this.form.category_id
        );
        if (index !== -1) {
          this.categories.splice(index, 1, updatedCategoryData);
        }

        this.resetForm();
        this.isEditing = false;
        Swal.fire("Success", "Kategori uppdaterad!", "success");
      } catch (error) {
        const errorMessages = error.response.data.errors
          .map((error) => error.msg)
          .join("<br>");

        // Display all error messages in the alert
        Swal.fire(
          "Error",
          `Kategori kunde inte uppdateras. Kolla vad du har skrivit in och försök igen! <br> ${errorMessages}`,
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
      const filteredProducts = this.products.filter(
        (product) => product.category_id === category_id
      );
      const filteredCategories = this.categories.filter(
        (category) => category.parent_category_id === category_id
      );

      const result = await Swal.fire({
        title: "Are you sure?",
        html:
          "Vill du verkligen ta bort den här kategorien? Detta kan inte ångras!<br>" +
          "Produkter och Underkategorier som är kopplade till kategorin kommer också att tas bort om du tar bort denna kategorin:<br>" +
          "<strong>Produkter:</strong><br>" +
          filteredProducts
            .map((product) => product.product_name)
            .join(",<br>") +
          "<br><strong>Kategorier:</strong><br>" +
          filteredCategories
            .map((category) => category.category_name)
            .join(",<br>"),
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
        await axiosInstance.delete(`/categories/${category_id}`);
        this.categories = this.categories.filter(
          (category) => category.category_id !== category_id
        );
        Swal.fire("Deleted!", "Kategori har tagits bort!", "success");
      } catch (error) {
        Swal.fire(
          "Error",
          "Kunde inte ta bort kategori. försök igen.",
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Reset the form fields
     */
    resetForm() {
      // Maintain category_id if editing
      const previousCategoryId = this.isEditing ? this.form.category_id : null;

      this.form = {
        category_id: previousCategoryId, // Keep the previous category ID
        name: "",
        parent_category_id: "",
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
.back {
  text-decoration: none;
  color: black;
  font-size: 14px;
  border: 1px solid black;
  padding: 8px 16px;
  font-family: "Playfair Display", serif;
  position: absolute;
  transform: translate(0%, -50%);
}

.back:hover {
  color: white;
  background-color: #202020;
}

.service-category-container {
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
  font-family: "Playfair Display", serif;
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
.form-group select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
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

tr:nth-child(2n) {
  background-color: #f8f8f8; /* Light gray background for every second td */
}

/* Responsive Design */
@media (max-width: 768px) {
  input {
    font-size: 16px;
  }
  select {
    font-size: 16px;
  }
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
  .form-group select {
    width: 100%;
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

  h1,
  h2 {
    margin-top: 30px;
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
    font-size: 14px;
  }

  td:nth-of-type(1)::before {
    content: "Kategori Namn";
  }
  td:nth-of-type(2)::before {
    content: "Huvudkategori";
  }
  td:nth-of-type(3)::before {
    content: "Åtgärder";
  }
}
</style>
