<template>
  <div v-if="product" class="showSizesMobileWrapper">
    <div class="sizesMobileOverlay" @click="close"></div>
    <div class="sizesMobilePopup">
      <div class="sizesMobilePopupWrapper">
        <div class="select-size extraselect-size">
          <div class="size-toggle" @click="toggleSizeMenu">
            {{ selectedSize ? selectedSize.size + " (vald)" : "Välj storlek" }}
            <font-awesome-icon icon="chevron-up" />
          </div>
        </div>

        <transition name="size-options">
          <div v-if="showSizeOptions" class="size-options">
            <p v-if="!product.variants || product.variants.length === 0">
              Inga Varianter :()
            </p>
            <div
              v-else
              v-for="variant in product.variants"
              :key="variant.size_id"
              @click="selectSize(variant)"
              class="variant-options"
            >
              <p>{{ variant.size }}</p>
              <p>{{ variant.price }} kr</p>
            </div>
          </div>
        </transition>

        <button class="add-to-cart-mobile" @click="addToCart">
          LÄGG I VARUKORG
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  name: "SizeSelectorMobile",
  components: {
    FontAwesomeIcon,
  },
  props: {
    product: Object,
  },
  data() {
    return {
      selectedSize: this.product ? this.product.variants[0] : null,
      showSizeOptions: false,
    };
  },
  methods: {
    close() {
      this.$emit("close");
    },
    toggleSizeMenu() {
      this.showSizeOptions = !this.showSizeOptions;
    },
    selectSize(variant) {
      this.selectedSize = variant;
      console.log(this.selectedSize);
      this.showSizeOptions = false;
    },
    addToCart() {
      if (this.selectedSize) {
        console.log({
          product: this.product,
          size: this.selectedSize,
          availableStock: this.selectedSize.stock_quantity,
        });
        this.$emit("add-to-cart", {
          product: this.product,
          size: this.selectedSize,
          availableStock: this.selectedSize.stock_quantity,
        });
      }
    },
  },
};
</script>

<style scoped>
.showSizesMobileWrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgb(0 0 0 / 20%);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 1000;
  transition: opacity 0.3s ease;
}

.sizesMobileOverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
}

.sizesMobilePopupWrapper {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sizesMobilePopup {
  width: 100%;
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease forwards;
  overflow-y: auto;
  max-height: 60vh;
}
.add-to-cart-mobile {
  background-color: #202020;
  color: white;
  padding: 16px 16px;
  font-size: 16px;
  border: 1px solid black;
  cursor: pointer;
  font-weight: normal;
  margin-top: 10px;
  width: 100%;
  font-family: "Playfair Display", serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}
.size-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.extraselect-size {
  width: 100%;
}
.size-toggle {
  display: flex;
  justify-content: space-between;
}
.variant-options {
  display: flex;
  justify-content: space-between;
  padding: 8px 0px;
  cursor: pointer;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
