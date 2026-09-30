const fs = require("fs");
const path = require("path");

require("dotenv").config();

const pool = require("../config/db");

async function setupDatabase() {
    const client = await pool.connect();

    try {
        console.log("Connected to PostgreSQL");

        // const schemaPath = path.join(__dirname, "..", "db", "init.sql");
        //   const schemaPath = path.join(__dirname, "..", "db", "init2.sql");
        //    const schemaPath = path.join(__dirname, "..", "db", "init3.sql");
         const schemaPath = path.join(__dirname, "..", "db", "init4.sql");

        const schemaSQL = fs.readFileSync(schemaPath, "utf8");

        console.log("Running init.sql...");

        await client.query(schemaSQL);

        console.log("Database setup completed successfully!");
    } catch (error) {
        console.error("Database setup failed:");
        console.error(error);
    } finally {
        client.release();
        await pool.end();
    }
}

setupDatabase();