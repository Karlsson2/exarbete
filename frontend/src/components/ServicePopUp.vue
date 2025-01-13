<template>
  <div v-if="isVisible" class="popup-overlay">
    <div class="popup">
      <h2>{{ service.name }}</h2>
      <p><strong>Beskrivning:</strong> {{ service.description }}</p>
      <div class="images">
        <div v-if="service.before_image_url" class="before">
          <img
            :src="service.before_image_url"
            alt="Before"
            @click="openImage(service.before_image_url)"
          />
        </div>
        <div v-if="service.after_image_url" class="after">
          <img
            :src="service.after_image_url"
            alt="After"
            @click="openImage(service.after_image_url)"
          />
        </div>
      </div>
      <button @click="closePopup">STÄNG</button>
    </div>
    <div
      v-if="enlargedImage"
      class="enlarged-image-overlay"
      @click="closeImage"
    >
      <img :src="enlargedImage" alt="Enlarged View" class="enlarged-image" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isVisible: {
      type: Boolean,
      required: true,
    },
    service: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      enlargedImage: null,
    };
  },
  methods: {
    closePopup() {
      this.$emit("close");
    },
    openImage(imageUrl) {
      this.enlargedImage = imageUrl;
    },
    closeImage() {
      this.enlargedImage = null;
    },
  },
};
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9000;
}
.popup {
  background: white;
  padding: 20px;
  border: 1px solid black;
  text-align: left;
  width: 400px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
h2 {
  font-family: "Playfair Display", serif;
  margin-bottom: 16px;
}
p {
  margin-bottom: 16px;
}
button {
  font-family: "Playfair Display", serif !important;
  letter-spacing: 4%;
  font-weight: 600;
  width: 100%;
  background-color: black;
  color: white;
  border: 1px solid black !important;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  margin-top: 10px;
}
button:hover {
  background-color: white;
  color: black;
  border: 1px solid black !important;
}
.images {
  display: flex;
  gap: 20px;
  width: 100%;
}
.before,
.after {
  width: 50%;
}
.before img,
.after img {
  width: 100%;
  height: 175px;
  object-fit: cover;
  cursor: pointer;
}
.before img:hover,
.after img:hover {
  border: 2px solid black;
}

.enlarged-image-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9000;
  cursor: pointer;
}
.enlarged-image {
  max-width: 90%;
  max-height: 90%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  border: 1px solid #fff;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .popup {
    width: 90%;
  }
}
</style>
