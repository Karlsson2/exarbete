<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Beauty Salon Administration</h1>
    </div>

    <div class="menu-grid">
      <div class="menu-item" style="--animation-order: 1">
        <a href="/admin/products" class="menu-link">
          <font-awesome-icon icon="box" class="menu-icon" />
          <h3 class="menu-title">Products</h3>
          <p class="menu-description">Manage your beauty product inventory</p>
        </a>
      </div>

      <div class="menu-item" style="--animation-order: 2">
        <a href="/admin/events" class="menu-link">
          <font-awesome-icon icon="calendar" class="menu-icon" />
          <h3 class="menu-title">Events</h3>
          <p class="menu-description">Schedule and manage salon events</p>
        </a>
      </div>

      <div class="menu-item" style="--animation-order: 3">
        <a href="/admin/product-reviews" class="menu-link">
          <font-awesome-icon icon="star" class="menu-icon" />
          <h3 class="menu-title">Product Reviews</h3>
          <p class="menu-description">Monitor customer product feedback</p>
        </a>
      </div>

      <div class="menu-item" style="--animation-order: 4">
        <a href="/admin/courses" class="menu-link">
          <font-awesome-icon icon="graduation-cap" class="menu-icon" />
          <h3 class="menu-title">Courses</h3>
          <p class="menu-description">Manage beauty training courses</p>
        </a>
      </div>

      <div class="menu-item" style="--animation-order: 5">
        <a href="/admin/services" class="menu-link">
          <font-awesome-icon icon="spa" class="menu-icon" />
          <h3 class="menu-title">Services</h3>
          <p class="menu-description">Update salon service offerings</p>
        </a>
      </div>

      <div class="menu-item" style="--animation-order: 6">
        <a href="/admin/service-categories" class="menu-link">
          <font-awesome-icon icon="tags" class="menu-icon" />
          <h3 class="menu-title">Service Categories</h3>
          <p class="menu-description">Organize service categories</p>
        </a>
      </div>

      <div class="menu-item" style="--animation-order: 7">
        <a href="/admin/page-reviews" class="menu-link">
          <font-awesome-icon icon="comments" class="menu-icon" />
          <h3 class="menu-title">Page Reviews</h3>
          <p class="menu-description">Manage website testimonials</p>
        </a>
      </div>

      <div class="menu-item" style="--animation-order: 8">
        <a href="/admin/product-categories" class="menu-link">
          <font-awesome-icon icon="layer-group" class="menu-icon" />
          <h3 class="menu-title">Product Categories</h3>
          <p class="menu-description">Organize product inventory</p>
        </a>
      </div>

      <div class="menu-item" style="--animation-order: 9">
        <a href="/admin/orders" class="menu-link">
          <font-awesome-icon icon="shopping-bag" class="menu-icon" />
          <h3 class="menu-title">Orders</h3>
          <p class="menu-description">Track and manage customer orders</p>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AdminDashboard",
};
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  background: linear-gradient(to bottom right, #faf7f2, #fff);
}

.dashboard-header {
  text-align: center;
  margin-bottom: 50px;
  color: #a39171;
  position: relative;
}

.dashboard-header h1 {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 20px;
  font-family: 'Playfair Display', serif;
}

.dashboard-header::after {
  content: '';
  display: block;
  width: 100px;
  height: 3px;
  background: linear-gradient(to right, #a39171, #d4c4a8);
  margin: 10px auto;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
}

.menu-item {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid #e8ded1;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.menu-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  border-color: #a39171;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, #a39171, #d4c4a8);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.menu-item:hover::before {
  opacity: 1;
}

.menu-link {
  text-decoration: none;
  color: #4a4a4a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.menu-icon {
  font-size: 24px;
  color: #a39171;
  margin-bottom: 10px;
}

.menu-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #2c3e50;
}

.menu-description {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 20px 10px;
  }

  .dashboard-header h1 {
    font-size: 28px;
  }

  .menu-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

/* Add some subtle animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-item {
  animation: fadeIn 0.5s ease forwards;
  animation-delay: calc(var(--animation-order) * 0.1s);
  opacity: 0;
}

/* Add a subtle texture overlay to the background */
.admin-dashboard::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a39171' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
  z-index: -1;
}
</style>