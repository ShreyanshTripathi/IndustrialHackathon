import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Ask } from "./pages/Ask";
import { GraphPage } from "./pages/Graph";
import { Landing } from "./pages/Landing";
import { NewAnalysis } from "./pages/NewAnalysis";
import { Profile } from "./pages/Profile";
import { Requirements } from "./pages/Requirements";
import { Runs } from "./pages/Runs";
import "./styles/app.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  {
    element: <Shell />,
    children: [
      { path: "/new", element: <NewAnalysis /> },
      { path: "/new/:runId", element: <NewAnalysis /> },
      { path: "/runs", element: <Runs /> },
      { path: "/runs/:runId", element: <Requirements /> },
      { path: "/runs/:runId/profile", element: <Profile /> },
      { path: "/runs/:runId/ask", element: <Ask /> },
      { path: "/runs/:runId/graph", element: <GraphPage view="structure" key="structure" /> },
      { path: "/runs/:runId/graph/meaning", element: <GraphPage view="meaning" key="meaning" /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
