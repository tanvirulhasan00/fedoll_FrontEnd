import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/main_routes.tsx"),
  route("blogs", "routes/blogs.tsx"),
  route("blogs/:id", "routes/blog-detail.tsx"),
] satisfies RouteConfig;
