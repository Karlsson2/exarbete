import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue"; // Make sure you have this view created
import CreateProduct from "@/views/CreateProductView.vue";
import CourseView from "../views/CourseView.vue";
import AdminPage from "@/views/AdminPage.vue";
import EventsView from "@/views/EventsView.vue";

const routes = [
  {
    path: "/",
    name: "HomeView",
    component: HomeView,
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
  }
  // Additional routes can be added here
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
