import { connectDb } from "./config/db";
import { app } from "./app";

const PORT = process.env.PORT || 3000;

connectDb()
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });