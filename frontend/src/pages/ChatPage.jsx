import { useEffect, useRef, useState } from "react";
import { chatApi } from "../api";
import Icon from "../components/Icon";
import { getErrorMessage } from "../utils/errors";
import { formatDateTime } from "../utils/format";

const HISTORY_PAGE_SIZE = 20;
const MAX_QUESTION_LENGTH = 1000;
const SUGGESTIONS = [
    "Nhân viên được nghỉ phép năm bao nhiêu ngày?",
    "Thời giờ làm việc của công ty như thế nào?",
    "Thời gian thử việc kéo dài bao lâu?",
];

// Hiện **chữ đậm** nếu AI lỡ dùng Markdown; phần còn lại giữ nguyên dạng chữ thường
function AnswerText({ text }) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part
    );
}

function Sources({ citations }) {
    if (!citations || citations.length === 0) {
        return null;
    }

    return (
        <div className="chat-sources">
            <span className="chat-sources__label">Nguồn:</span>
            {citations.map((citation, index) => (
                <span key={index} className="chat-source">
                    <Icon name="book" size={14} />
                    {citation.title}
                    {citation.page_number ? `, trang ${citation.page_number}` : ""}
                </span>
            ))}
        </div>
    );
}

function Turn({ turn }) {
    return (
        <div className="chat-turn">
            <div className="chat-bubble chat-bubble--user">{turn.question}</div>
            <div className="chat-bubble chat-bubble--bot">
                {turn.pending ? (
                    <span className="chat-typing">
                        Đang tìm trong tài liệu
                        <span className="chat-typing__dots" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </span>
                    </span>
                ) : (
                    <>
                        <div className="chat-bubble__text">
                            <AnswerText text={turn.answer} />
                        </div>
                        <Sources citations={turn.citations} />
                        <div className="chat-bubble__meta">{formatDateTime(turn.created_at)}</div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ChatPage() {
    const [turns, setTurns] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [info, setInfo] = useState({ configured: true, remaining: null, limit: null });
    const [question, setQuestion] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef(null);
    const scrollToBottomRef = useRef(true);

    // Nạp lịch sử: API trả mới nhất trước, đảo lại để hiển thị cũ ở trên, mới ở dưới
    const loadHistory = async (nextPage) => {
        setLoadingHistory(true);

        try {
            const result = await chatApi.history({ page: nextPage, limit: HISTORY_PAGE_SIZE });
            const older = [...result.data].reverse();

            scrollToBottomRef.current = nextPage === 1;
            setTurns((current) => (nextPage === 1 ? older : [...older, ...current]));
            setPage(nextPage);
            setHasMore(nextPage < result.pagination.total_pages);
            setInfo({
                configured: result.chatbot_configured,
                remaining: result.remaining_today,
                limit: result.daily_limit,
            });
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        loadHistory(1);
    }, []);

    useEffect(() => {
        if (scrollToBottomRef.current && bottomRef.current) {
            bottomRef.current.scrollIntoView({ block: "end" });
        }
    }, [turns]);

    const send = async (text) => {
        const trimmed = text.trim();

        if (!trimmed || sending) {
            return;
        }

        const pendingId = `pending-${Date.now()}`;

        setError("");
        setSending(true);
        setQuestion("");
        scrollToBottomRef.current = true;
        setTurns((current) => [...current, { id: pendingId, question: trimmed, pending: true }]);

        try {
            const result = await chatApi.ask(trimmed);

            setTurns((current) => current.map((turn) => (turn.id === pendingId ? result : turn)));
            setInfo((current) => ({ ...current, remaining: result.remaining_today }));
        } catch (requestError) {
            // Bỏ lượt đang chờ và trả câu hỏi lại ô nhập để người dùng gửi lại
            setTurns((current) => current.filter((turn) => turn.id !== pendingId));
            setQuestion(trimmed);
            setError(getErrorMessage(requestError));
        } finally {
            setSending(false);
        }
    };

    const onSubmit = (event) => {
        event.preventDefault();
        send(question);
    };

    // Enter để gửi, Shift + Enter để xuống dòng
    const onKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            send(question);
        }
    };

    const outOfQuestions = info.remaining === 0;
    const disabled = sending || !info.configured || outOfQuestions;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Hỏi đáp tài liệu</h1>
                    <p className="page-subtitle">Hỏi về nội quy, chính sách nhân sự; trợ lý trả lời dựa trên tài liệu công ty</p>
                </div>
                {info.limit !== null && (
                    <span className="badge badge--neutral">
                        Còn {info.remaining}/{info.limit} lượt hỏi hôm nay
                    </span>
                )}
            </div>

            {!info.configured && (
                <div className="alert alert--error">Chatbot chưa được cấu hình. Liên hệ quản trị viên.</div>
            )}

            <section className="chat card">
                <div className="chat__messages">
                    {hasMore && (
                        <button
                            type="button"
                            className="btn btn--small chat__more"
                            onClick={() => loadHistory(page + 1)}
                            disabled={loadingHistory}
                        >
                            {loadingHistory ? "Đang tải..." : "Xem câu hỏi cũ hơn"}
                        </button>
                    )}

                    {loadingHistory && turns.length === 0 && <div className="page-loading">Đang tải...</div>}

                    {!loadingHistory && turns.length === 0 && (
                        <div className="chat__empty">
                            <span className="chat__empty-icon">
                                <Icon name="chat" size={26} />
                            </span>
                            <h2 className="chat__empty-title">Bạn muốn hỏi gì?</h2>
                            <p className="chat__empty-text">Thử một trong các câu hỏi sau, hoặc tự gõ câu hỏi bên dưới.</p>
                            <div className="chat__suggestions">
                                {SUGGESTIONS.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        className="chat__suggestion"
                                        onClick={() => send(suggestion)}
                                        disabled={disabled}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {turns.map((turn) => (
                        <Turn key={turn.id} turn={turn} />
                    ))}
                    <div ref={bottomRef} />
                </div>

                <form className="chat__composer" onSubmit={onSubmit}>
                    {error && <div className="alert alert--error">{error}</div>}
                    <div className="chat__input-row">
                        <textarea
                            className="input chat__input"
                            rows={2}
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            onKeyDown={onKeyDown}
                            maxLength={MAX_QUESTION_LENGTH}
                            placeholder={
                                outOfQuestions
                                    ? "Bạn đã dùng hết lượt hỏi hôm nay"
                                    : "Nhập câu hỏi... (Enter để gửi, Shift + Enter để xuống dòng)"
                            }
                            disabled={disabled}
                            aria-label="Câu hỏi"
                        />
                        <button
                            type="submit"
                            className="btn btn--primary chat__send"
                            disabled={disabled || !question.trim()}
                            aria-label="Gửi câu hỏi"
                        >
                            <Icon name="send" />
                        </button>
                    </div>
                    <p className="chat__note">
                        Câu trả lời do AI tạo dựa trên tài liệu, có thể chưa chính xác. Hãy đối chiếu tài liệu gốc khi cần.
                    </p>
                </form>
            </section>
        </>
    );
}
