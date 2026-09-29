const app = require("./app");
require("dotenv").config();
const pool = require("./config/db");

const PORT = 8000;

async function testDatabase() {
    try {
        const result = await pool.query("SELECT NOW()");
       
    } catch (error) {
        console.error("PostgreSQL connection failed:", error);
    }
}


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

testDatabase();