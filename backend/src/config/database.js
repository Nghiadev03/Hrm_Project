const { Sequelize } = require("sequelize");
const pg = require("pg");
require("dotenv").config();

// Các cột created_at / updated_at là "timestamp without time zone" và Sequelize ghi vào theo UTC.
// Mặc định pg đọc kiểu này theo giờ máy nên bị lệch múi giờ; ép đọc lại theo UTC.
const TIMESTAMP_WITHOUT_TIME_ZONE = 1114;

pg.types.setTypeParser(TIMESTAMP_WITHOUT_TIME_ZONE, (value) => {
    return new Date(`${value.replace(" ", "T")}Z`);
});

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        logging: false,
    }
);

module.exports = sequelize;