const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// static file
app.use(express.static("public"));

// 🔴 TEST ROUTE PALING SEDERHANA
app.get("/api/start", (req, res) => {
  res.json({
    status: "OK",
    message: "API START WORKING"
  });
});

app.get("/", (req, res) => {
  res.send("Remi Jumlah 10 Online");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
