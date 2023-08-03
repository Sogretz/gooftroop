import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {createBrowserRouter, RouterProvider, } from "react-router-dom";
import "./index.css";
import Root from "./routes/root";
import ErrorPage from "./error-page";
import Raids from "./raids/raids";
import RaidOverview from "./raids/raidOverview.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        errorElement: <ErrorPage />
    },
    {
        path: "/raids/",
        element: <Raids />,
        errorElement: <ErrorPage />
    },
    {
        path: "/raids/overview",
        element: <RaidOverview />,
        errorElement: <ErrorPage />
    },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);