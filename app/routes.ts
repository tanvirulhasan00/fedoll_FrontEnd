import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/main_routes.tsx"),
  route("blogs", "routes/blogs.tsx"),
  route("blogs/:id", "routes/blog-detail.tsx"),
  route("about-us", "routes/about-us.tsx"),
  route("contact-us", "routes/contact-us.tsx"),
  route("contact", "routes/contact-us.tsx", { id: "contact-alias" }),
  route("products", "routes/products.tsx"),
  route("products/:id", "routes/product-detail.tsx"),
  route("product/:id", "routes/product-detail.tsx", { id: "product-alias" }),
  route("profile", "routes/profile.tsx"),
  route("track-order", "routes/track-order.tsx"),
  route("admin", "routes/admin.tsx"),
  route("dashboard", "routes/admin.tsx", { id: "dashboard-alias" }),
  route("deshboard", "routes/admin.tsx", { id: "deshboard-alias" }),
] satisfies RouteConfig;
