import React from "react";
import type { Route } from "./+types/main_routes";

import Home from "./home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SilkenDrift" },
    {
      name: "description",
      content: "SilkenDrift - Premium E-Commerce Platform",
    },
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
