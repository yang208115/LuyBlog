import { authMiddleware } from "../../middleware/auth";
import { adminMiddleware } from "../../middleware/admin";
import { createAdminApp } from "./shared";
import site from "./site";
import navItems from "./navItems";
import posts from "./posts";
import moments from "./moments";
import projects from "./projects";
import pages from "./pages";
import friendLinks from "./friendLinks";
import comments from "./comments";
import users from "./users";

const app = createAdminApp();
app.use("/*", authMiddleware, adminMiddleware);

app.route("/", site);
app.route("/", navItems);
app.route("/", posts);
app.route("/", moments);
app.route("/", projects);
app.route("/", pages);
app.route("/", friendLinks);
app.route("/", comments);
app.route("/", users);

export default app;
