import React from "react";
import type { Route } from "./+types/main_routes";

import Home from "./home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

const MainRoutes = () => {
  return (
    <div>
      <Home />
    </div>
  );
};

export default MainRoutes;
