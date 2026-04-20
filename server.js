import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Redirect /index.html to /
app.get("/index.html", (req, res) => {
  res.redirect("/");
});

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, "dist")));

// For all other routes, serve index.html (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
