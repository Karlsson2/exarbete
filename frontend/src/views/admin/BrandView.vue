<template>
  <div class="service-category-container">
    <router-link to="/admin" class="back"
      ><font-awesome-icon icon="chevron-left" /> Tillbaka</router-link
    >
    <h1>Märken</h1>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <!-- Add/Edit ServiceCategory Form -->
    <div class="form-container" ref="formContainer">
      <h2>{{ isEditing ? "Ändra Kategori" : "Lägg till nytt märke" }}</h2>
      <form
        @submit.prevent="isEditing ? updateBrand() : addBrand()"
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
            placeholder="Circadia, Herbs2Peel, etc"
          />
        </div>

        <!-- Buttons -->
        <div class="button-group">
          <button type="submit">
            {{ isEditing ? "Updatera" : "Lägg till" }} Märke
          </button>
          <button type="button" v-if="isEditing" @click="cancelEdit">
            Avbryt
          </button>
        </div>
      </form>
    </div>

    <!-- Category List -->
    <div class="list-container">
      <h2>Alla Märken</h2>
      <table>
        <thead>
          <tr>
            <th>Märke</th>
            <th>Åtgärder</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="brand in brands" :key="brand.brand_id">
            <td>{{ brand.brand_name }}</td>

            <td>
              <button @click="editBrand(brand)">
                <font-awesome-icon :icon="['fas', 'edit']" />
              </button>
              <button @click="deleteBrand(brand)">
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
  name: "BrandView",
  data() {
    return {
      brands: [],
      form: {
        brand_id: null,
        name: "",
      },
      isEditing: false,
      isLoading: false, // For loading indicator
    };
  },
  created() {
    this.fetchBrands();
  },
  methods: {
    /**
     * Fetch all brands from the backend.
     */
    async fetchBrands() {
      this.isLoading = true;
      try {
        const response = await axiosInstance.get(`/brands`);
        this.brands = response.data.map((brand) => ({
          ...brand,
        }));
      } catch (error) {
        console.error(
          "Error fetching categories:",
          error.response || error.message
        );
        Swal.fire("Error", "Kunde inte hämta märken. Försök igen!.", "error");
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Add a new category
     */
    async addBrand() {
      try {
        this.isLoading = true;

        const response = await axiosInstance.post(`/brands`, {
          brand_name: this.form.name,
        });

        const addedBrand = { ...response.data };
        this.brands.push(addedBrand);
        this.resetForm();
        Swal.fire("Success", "Märke tillagt!", "success");
      } catch (error) {
        console.error(
          "Error adding category:",
          error.response || error.message
        );
        // Get all error messages from the response
        const errorMessages = error.response.data.errors
          .map((error) => error.msg)
          .join("<br>");

        // Display all error messages in the alert
        Swal.fire(
          "Error",
          `Märke kunde inte läggas till. Kolla vad du har skrivit in och försök igen! <br> ${errorMessages}`,
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Prepare to edit a category by pre-filling the form.
     */
    editBrand(brand) {
      this.isEditing = true;
      this.form.name = brand.brand_name;
      this.form.brand_id = brand.brand_id;
      this.$nextTick(() => {
        this.$refs.formContainer.scrollIntoView({ behavior: "smooth" });
      });
    },

    /**
     * Update an existing category
     */

    async updateBrand() {
      try {
        this.isLoading = true;

        const response = await axiosInstance.put(
          `/brands/${this.form.brand_id}`,
          {
            brand_name: this.form.name,
          }
        );

        const updatedBrandData = { ...response.data };
        const index = this.brands.findIndex(
          (c) => c.brand_id === this.form.brand_id
        );
        if (index !== -1) {
          this.brands.splice(index, 1, updatedBrandData);
        }

        this.resetForm();
        this.isEditing = false;
        Swal.fire("Success", "Märke uppdaterat!", "success");
      } catch (error) {
        console.error("Error updating brand:", error.response || error.message);
        Swal.fire(
          "Error",
          `Märke kunde inte uppdateras. Kolla vad du har skrivit in och prova igen! <br> ${error.response.data.errors[0].msg}`,
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Delete abrand.
     */
    async deleteBrand(brand_id) {
      const result = await Swal.fire({
        title: "Are you sure?",
        html: "Vill du verkligen ta bort det här märket? Detta kan inte ångras!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Ja, ta bort det!",
        cancelButtonText: "Avbryt",
      });

      // Check if the user confirmed the action
      if (!result.isConfirmed) return;

      try {
        this.isLoading = true;
        await axiosInstance.delete(`/brands/${brand_id}`);
        this.brands = this.brands.filter(
          (brand) => brand.brand_id !== brand_id
        );
        Swal.fire("Borttagen!", "Märke borttaget!", "success");
      } catch (error) {
        console.error(
          "Error deleting category:",
          error.response || error.message
        );
        Swal.fire(
          "Error",
          "Märke kunde inte tas bort. Snälla försök igen senare.",
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
      const previousBrandId = this.isEditing ? this.form.brand_id : null;

      this.form = {
        brand_id: previousBrandId, // Keep the previous category ID
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
  color: #555;
}

h1 {
  color: #333;
}
h1,
h2 {
  font-family: "Playfair Display", serif;
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
    content: "Huvudkategori";
  }
  td:nth-of-type(3)::before {
    content: "Åtgärder";
  }
}
</style>
