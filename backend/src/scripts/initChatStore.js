// Tạo kho tài liệu (File Search store) trên Gemini cho chatbot và ghi tên kho vào .env.
// Chạy lại không sao: đã có GEMINI_STORE_NAME thì bỏ qua.
//   npm run chat:init
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const gemini = require("../utils/gemini");

const ENV_FILE = path.resolve(__dirname, "../../.env");

async function main() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in .env (create one at https://aistudio.google.com/api-keys)");
    }

    if (process.env.GEMINI_STORE_NAME) {
        console.log(`Store already configured: ${process.env.GEMINI_STORE_NAME}, skipped.`);
        return;
    }

    const store = await gemini.createStore("hrm-documents");
    let text = fs.readFileSync(ENV_FILE, "utf8");

    if (/^GEMINI_STORE_NAME=.*$/m.test(text)) {
        // Có dòng nhưng để trống: điền vào dòng đó
        text = text.replace(/^GEMINI_STORE_NAME=.*$/m, `GEMINI_STORE_NAME=${store.name}`);
    } else {
        text += `${text.endsWith("\n") ? "" : "\n"}GEMINI_STORE_NAME=${store.name}\n`;
    }

    fs.writeFileSync(ENV_FILE, text);
    console.log(`Created store ${store.name} and saved it to .env. Restart the backend to use it.`);
}

main().catch((error) => {
    console.error("Failed to create chatbot store:");
    console.error(error.message);
    process.exit(1);
});
