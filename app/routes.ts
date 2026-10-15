import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/main_routes.tsx"),
  route("blogs", "routes/blogs.tsx"),
  route("blogs/:id", "routes/blog-detail.tsx"),
  route("about-us", "routes/about-us.tsx"),
  route("contact-us", "routes/contact-us.tsx"),
  route("contact", "routes/contact-us.tsx", { id: "contact-alias" }),
] satisfies RouteConfig;
