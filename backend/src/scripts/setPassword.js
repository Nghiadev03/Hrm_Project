// Đặt lại mật khẩu (bcrypt) cho tài khoản.
//   node src/scripts/setPassword.js <mật khẩu>            -> tất cả tài khoản
//   node src/scripts/setPassword.js <mật khẩu> <email>    -> một tài khoản
require("dotenv").config();

const bcrypt = require("bcrypt");
const { sequelize, Employee } = require("../models");

async function main() {
    const [password, email] = process.argv.slice(2);

    if (!password) {
        console.error("Usage: node src/scripts/setPassword.js <password> [email]");
        process.exit(1);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const where = email ? { email } : {};
    const [count] = await Employee.update({ password_hash }, { where });

    console.log(`Updated password for ${count} account(s).`);
    await sequelize.close();
}

main().catch((error) => {
    console.error("Failed to set password:");
    console.error(error.message);
    process.exit(1);
});
