<template>
  <div class="course-container">
    <router-link to="/admin" class="back"
      ><font-awesome-icon icon="chevron-left" /> Tillbaka</router-link
    >
    <h1>Kurser</h1>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <!-- Add/Edit Course Form -->
    <div class="form-container" ref="formContainer">
      <h2>{{ isEditing ? "Ändra Kurs" : "Lägg till ny Kurs" }}</h2>
      <form
        @submit.prevent="isEditing ? updateCourse() : addCourse()"
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
            placeholder="Hårstylings kurs, Massage kurs"
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description">Beskrivning:</label>
          <textarea
            v-model="form.description"
            id="description"
            placeholder="Skriv en beskrivning om kursen"
            required
          ></textarea>
        </div>

        <!-- Price -->
        <div class="form-group">
          <label for="price">Pris:</label>
          <input
            v-model.number="form.price"
            type="number"
            id="price"
            min="0"
            step="0.01"
            required
          />
        </div>

        <!-- Schedule -->
        <div class="form-group">
          <label for="schedule">Tid:</label>
          <input
            v-model="form.schedule"
            id="schedule"
            type="datetime-local"
            required
            @click="showDatePicker"
            ref="scheduleInput"
          />
        </div>

        <!-- Image Upload -->
        <div class="form-group">
          <label for="image_upload">Ladda upp bild:</label>
          <input
            type="file"
            id="image_upload"
            @change="handleImageUpload"
            accept="image/*"
            :required="!isEditing || selectedImage"
          />
          <!-- Image Preview -->
          <div v-if="imagePreview">
            <img
              :src="imagePreview"
              alt="Image Preview"
              class="image-preview"
            />
          </div>
        </div>

        <!-- Booking Link -->
        <div class="form-group">
          <label for="booking_link">Bokningslänk (bokadirekt):</label>
          <input
            v-model="form.booking_link"
            type="url"
            id="booking_link"
            placeholder="https://example.com/book"
          />
        </div>

        <!-- Buttons -->
        <div class="button-group">
          <button type="submit">
            {{ isEditing ? "Updatera" : "Lägg till" }} Kurs
          </button>
          <button type="button" v-if="isEditing" @click="cancelEdit">
            Avbryt
          </button>
        </div>
      </form>
    </div>

    <!-- Courses List -->
    <div class="list-container">
      <h2>Alla Kurser</h2>
      <table>
        <thead>
          <tr>
            <th>Kursnamn</th>
            <th>Beskrivning</th>
            <th>Pris</th>
            <th>Tid</th>
            <th>Bild</th>
            <th>Bokningslänk</th>
            <th>Åtgärder</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courses" :key="course.course_id">
            <td>{{ course.name }}</td>
            <td>{{ course.description }}</td>
            <td>{{ formatPrice(course.price) }}</td>
            <td>{{ formatDate(course.schedule) }}</td>
            <td>
              <img
                :src="course.image_url"
                alt="Course Image"
                class="course-image"
              />
            </td>
            <td>
              <a :href="course.booking_link" target="_blank">länk</a>
            </td>

            <td>
              <button @click="editCourse(course)">
                <font-awesome-icon :icon="['fas', 'edit']" />
              </button>
              <button @click="deleteCourse(course.course_id)">
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
  name: "CourseView",
  data() {
    return {
      courses: [],
      form: {
        course_id: null, // Used for editing
        name: "",
        description: "",
        price: 0,
        schedule: "",
        booking_link: "",
      },
      selectedImage: null, // Store the selected image file
      imagePreview: null, // Store the image preview URL
      isEditing: false,
      isLoading: false, // For loading indicator
    };
  },
  created() {
    this.fetchCourses();
  },
  mounted() {
    // Initialize the date picker
    if (!this.form.schedule) {
      const now = new Date();
      // Format the date to 'YYYY-MM-DDTHH:mm' using local time
      const localISOTime =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0") +
        "T" +
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0");

      this.form.schedule = localISOTime;
    }
  },

  methods: {
    /**
     * Fetch all courses from the backend.
     */
    async fetchCourses() {
      this.isLoading = true;
      try {
        const response = await axiosInstance.get(`/courses`);
        this.courses = response.data.map((course) => ({
          ...course,
          price: Number(course.price), // Ensure 'price' is a number
        }));
      } catch (error) {
        console.error(
          "Error fetching courses:",
          error.response || error.message
        );
        Swal.fire("Error", "Kunde inte hämta kurser. Försök igen.", "error");
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Handle image selection and generate a preview.
     */
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Validate image type
      if (!file.type.startsWith("image/")) {
        Swal.fire(
          "Error",
          "Ladda upp en godkänd bildfil, .jpg, .png.",
          "error"
        );
        this.selectedImage = null;
        this.imagePreview = null;
        return;
      }

      this.selectedImage = file;

      // Generate image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    /**
     * Add a new course with image upload.
     */
    async addCourse() {
      // Validate that an image has been selected
      if (!this.selectedImage) {
        Swal.fire("Error", "Välj en bild att ladda upp.", "error");
        return;
      }

      // Create FormData object
      const formData = new FormData();
      formData.append("courseImage", this.selectedImage);
      formData.append("name", this.form.name);
      formData.append("description", this.form.description);
      formData.append("price", this.form.price);
      formData.append("schedule", this.form.schedule);
      formData.append(
        "booking_link",
        this.form.booking_link || "https://www.snbeauty.se/kontakt"
      );

      try {
        this.isLoading = true;
        const response = await axiosInstance.post(`/courses`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const addedCourse = {
          ...response.data,
          price: Number(response.data.price), // Ensure 'price' is a number
        };
        this.courses.push(addedCourse);
        this.resetForm();
        Swal.fire("Success", "Kurs tillagd!", "success");
      } catch (error) {
        console.error("Error adding course:", error.response || error.message);
        // Get all error messages from the response
        const errorMessages = error.response.data.errors
          .map((error) => error.msg)
          .join("<br>");

        // Display all error messages in the alert
        Swal.fire(
          "Error",
          `Kursen kunde inte läggas till. Kolla vad du har skrivit in och försök igen! <br> ${errorMessages}`,
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Prepare to edit a course by pre-filling the form.
     */
    editCourse(course) {
      this.isEditing = true;
      this.form = { ...course };
      this.form.price = Number(this.form.price); // Ensure 'price' is a number
      this.form.schedule = this.formatScheduleForFrontend(this.form.schedule);

      // Display the existing image as a preview
      this.imagePreview = course.image_url;

      // Reset selectedImage as the user hasn't selected a new image yet
      this.selectedImage = null;

      this.$nextTick(() => {
        this.$refs.formContainer.scrollIntoView({ behavior: "smooth" });
      });
    },

    /**
     * Update an existing course with optional image upload.
     */
    async updateCourse() {
      const formData = new FormData();

      // Always append the course_id to the FormData
      if (this.selectedImage) {
        formData.append("courseImage", this.selectedImage);
      } else {
        formData.append("image_url", this.imagePreview);
      }

      // Append other form fields
      formData.append("name", this.form.name);
      formData.append("description", this.form.description);
      formData.append("price", this.form.price);
      formData.append("schedule", this.form.schedule);
      formData.append("booking_link", this.form.booking_link);

      try {
        this.isLoading = true;
        const response = await axiosInstance.put(
          `/courses/${this.form.course_id}`, // Make sure course_id is correctly referenced
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const updatedCourseData = {
          ...response.data,
          price: Number(response.data.price), // Ensure 'price' is a number
        };

        // Update courses array with the new data
        const index = this.courses.findIndex(
          (c) => c.course_id === this.form.course_id
        );
        if (index !== -1) {
          this.courses.splice(index, 1, updatedCourseData);
        }

        this.resetForm();
        this.isEditing = false;
        Swal.fire("Success", "Kurs uppdaterad", "success");
      } catch (error) {
        console.error(
          "Error updating course:",
          error.response || error.message
        );
        console.error("Error adding course:", error.response || error.message);
        // Get all error messages from the response
        const errorMessages = error.response.data.errors
          .map((error) => error.msg)
          .join("<br>");

        // Display all error messages in the alert
        Swal.fire(
          "Error",
          `Kursen kunde inte läggas till. Kolla vad du har skrivit in och försök igen! <br> ${errorMessages}`,
          "error"
        );
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Delete a course.
     */
    async deleteCourse(course_id) {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Är du säker på att du vill ta bort denna kursen? Du kan inte ändra dig sen.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ja, ta bort den!",
        cancelButtonText: "Avbryt",
      });

      // Check if the user confirmed the action
      if (!result.isConfirmed) return;

      try {
        this.isLoading = true;
        await axiosInstance.delete(`/courses/${course_id}`);
        this.courses = this.courses.filter(
          (course) => course.course_id !== course_id
        );
        Swal.fire("Deleted!", "Kurs borttagen!", "success");
      } catch (error) {
        console.error(
          "Error deleting course:",
          error.response || error.message
        );
        Swal.fire("Error", "Kunde inte ta bort kurs, försök igen.", "error");
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Reset the form fields and clear image selections.
     */
    resetForm() {
      // Maintain course_id if editing
      const previousCourseId = this.isEditing ? this.form.course_id : null;

      this.form = {
        course_id: previousCourseId, // Keep the previous course ID
        name: "",
        description: "",
        price: 0,
        schedule: "",
        booking_link: "",
      };

      this.selectedImage = null;
      this.imagePreview = null;

      // Reset the file input value
      const fileInput = document.getElementById("image_upload");
      if (fileInput) {
        fileInput.value = "";
      }
    },

    /**
     * Cancel editing and reset the form.
     */
    cancelEdit() {
      this.resetForm();
      this.isEditing = false;
    },

    /**
     * Format date to a readable format.
     */
    formatDate(datetime) {
      if (!datetime) return "N/A";
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(datetime).toLocaleDateString("sv-SE", options);
    },

    /**
     * Show the date picker for the schedule input.
     */
    showDatePicker() {
      this.$refs.scheduleInput.showPicker(); // showPicker explicitly calls the datepicker
    },

    /**
     * Format price safely.
     */
    formatPrice(price) {
      if (isNaN(price)) return "N/A";
      return Number(price).toFixed(2);
    },

    /**
     * Format schedule for frontend (convert from 'YYYY-MM-DD HH:MM:SS' to 'YYYY-MM-DDTHH:MM').
     */
    formatScheduleForFrontend(schedule) {
      if (!schedule) return "";

      const date = new Date(schedule);
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", schedule);
        return "";
      }

      const localDateString = date.toLocaleString("sv-SE", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hour12: false,
      });

      return localDateString.slice(0, 16);
    },
  },
};
</script>

<style scoped>
.course-container {
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
#schedule {
  background: white !important;
  color: black !important;
  width: 100%;
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

.course-image {
  width: 100px;
  height: auto;
  object-fit: cover;
  border-radius: 4px;
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
  input,
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

  h1,
  h2 {
    text-align: center;
    margin-bottom: 20px;
    margin-top: 30px;
  }

  td:nth-of-type(1)::before {
    content: "Namn";
  }
  td:nth-of-type(2)::before {
    content: "Beskrivning";
  }
  td:nth-of-type(3)::before {
    content: "Pris";
  }
  td:nth-of-type(4)::before {
    content: "Tid";
  }
  td:nth-of-type(5)::before {
    content: "Bild";
  }
  td:nth-of-type(6)::before {
    content: "Booknings länk";
  }
  td:nth-of-type(7)::before {
    content: "Åtgärder";
  }
}
</style>
