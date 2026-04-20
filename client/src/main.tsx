import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

function normalizeDirectRouteAccess() {
  const { hash, pathname, search } = window.location;

  if (hash) {
    return;
  }

  const normalizedPath =
    pathname !== "/" && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const isKnownAppRoute =
    normalizedPath === "/booking" ||
    normalizedPath === "/admin" ||
    normalizedPath.startsWith("/admin/");

  if (!isKnownAppRoute) {
    return;
  }

  window.history.replaceState(
    null,
    "",
    `/#${normalizedPath}${search}`,
  );
}

normalizeDirectRouteAccess();

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
