import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import CreateProduct from "@/views/CreateProductView.vue";
import CourseView from "../views/CourseView.vue";
import AdminPage from "@/views/AdminPage.vue";
import EventsView from "@/views/EventsView.vue";
import ServicePage from "../views/ServiceView.vue";
import ServiceCategoriesPage from "../views/ServiceCategoriesView.vue";
import PageReviewsPage from "../views/PageReviewsView.vue";
import ProductCategoriesPage from "../views/ProductCategories.vue";
import LoginPage from "../views/LoginPage.vue";
import RegisterPage from "@/views/RegisterPage.vue";


const routes = [
  {
    path: "/",
    name: "HomeView",
    component: HomeView,
  },
  {
    path: "/register",
    name: "RegisterPage",
    component: RegisterPage,
  },
  {
    path: "/login",
    name: "LoginPage",
    component: LoginPage,
  },
  {
    path: "/admin/createproduct",
    name: "CreateProduct",
    component: CreateProduct,
  },
  {
    path: "/admin/courses",
    name: "CourseView",
    component: CourseView,
  },
  {
    path: "/admin",
    name: "Admin Page",
    component: AdminPage,
  },
  {
    path: "/admin/events",
    name: "EventsView",
    component: EventsView,
  },
  {
    path: "/admin/services",
    name: "Service Page",
    component: ServicePage,
  },
  {
    path: "/admin/service-categories",
    name: "Service Categories Page",
    component: ServiceCategoriesPage,
  },
  {
    path: "/admin/page-reviews",
    name: "Page Reviews Page",
    component: PageReviewsPage,
  },
  {
    path: "/admin/product-categories",
    name: "Product Categories Page",
    component: ProductCategoriesPage,
  },
  // Additional routes can be added here
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
