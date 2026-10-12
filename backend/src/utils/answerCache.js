// Nhớ câu trả lời của các câu hỏi đã gặp để trả lời ngay, không gọi lại Gemini.
// Lưu trong bộ nhớ server: khởi động lại thì mất, tài liệu thay đổi thì xoá hết.
const MAX_ENTRIES = 200;

const cache = new Map();

// "  Nghỉ phép  mấy ngày?? " và "nghỉ phép mấy ngày" coi là một câu
const normalize = (question) =>
    question
        .normalize("NFC")
        .toLowerCase()
        .replace(/[?!.,;:…]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const get = (question) => cache.get(normalize(question)) || null;

const set = (question, value) => {
    const key = normalize(question);

    // Map giữ thứ tự thêm vào; đầy thì bỏ câu cũ nhất
    cache.delete(key);
    cache.set(key, value);

    if (cache.size > MAX_ENTRIES) {
        cache.delete(cache.keys().next().value);
    }
};

const clear = () => cache.clear();

module.exports = {
    get,
    set,
    clear,
};
