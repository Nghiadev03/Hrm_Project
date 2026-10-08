const bcrypt = require("bcrypt");

const MIN_PASSWORD_LENGTH = 6;

const isValidPassword = (password) => {
    return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
};

const hashPassword = (password) => bcrypt.hash(password, 10);

const comparePassword = (password, hash) => bcrypt.compare(password, hash);

module.exports = {
    MIN_PASSWORD_LENGTH,
    isValidPassword,
    hashPassword,
    comparePassword,
};
