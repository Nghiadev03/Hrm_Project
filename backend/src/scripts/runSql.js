// Chạy một file SQL lên database trong .env.
//   node src/scripts/runSql.js sql/001_leave_balance_and_password_reset.sql
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database");

async function main() {
    const file = process.argv[2];

    if (!file) {
        console.error("Usage: node src/scripts/runSql.js <file.sql>");
        process.exit(1);
    }

    const sql = fs.readFileSync(path.resolve(file), "utf8");

    await sequelize.query(sql);
    console.log(`Executed ${file}`);
    await sequelize.close();
}

main().catch((error) => {
    console.error("Failed to run SQL:");
    console.error(error.message);
    process.exit(1);
});
