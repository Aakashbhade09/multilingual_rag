let isProcessing = false;
let chatHistory = [];

const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const uploadStatus = document.getElementById("uploadStatus");
const uploadsList = document.getElementById("uploadsList");
const questionInput = document.getElementById("questionInput");
const languageSelect = document.getElementById("languageSelect");
const dashboardLanguageSelect = document.getElementById("dashboardLanguageSelect");
const askButton = document.getElementById("askButton");
const chatWindow = document.getElementById("chatWindow");
const welcomeCard = document.getElementById("welcomeCard");

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

const totalChunks = document.getElementById("totalChunks");
const modelName = document.getElementById("modelName");
const dashDocsCount = document.getElementById("dashDocsCount");
const dashChunksCount = document.getElementById("dashChunksCount");
const dashQueriesCount = document.getElementById("dashQueriesCount");

const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const demoLoginBtn = document.getElementById("demoLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");

const currentUser = document.getElementById("currentUser");
const dashboardUser = document.getElementById("dashboardUser");
const profileUserName = document.getElementById("profileUserName");
const profileFullName = document.getElementById("profileFullName");
const profileAvatar = document.getElementById("profileAvatar");
const sidebarAvatar = document.getElementById("sidebarAvatar");
const topProfileDot = document.getElementById("topProfileDot");

const themeToggleBtn = document.getElementById("themeToggleBtn");
const settingsLanguageSelect = document.getElementById("settingsLanguageSelect");
const settingsClearChatBtn = document.getElementById("settingsClearChatBtn");
const clearDocsBtn = document.getElementById("clearDocsBtn");
const clearChatBtn = document.getElementById("clearChatBtn");

const documentSearchInput = document.getElementById("documentSearchInput");

let uploadedDocumentsCache = [];

document.addEventListener("DOMContentLoaded", async () => {
    checkLogin();
    setupEvents();
    loadSavedLanguage();

    await loadStats();
    await loadDocuments();
    await updateProfileStats();

    loadChatHistory();
    updateQueryCount();
});

function setupEvents() {
    document.querySelectorAll(".menu-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            showPage(btn.dataset.page);
        });
    });

    document.getElementById("startChatBtn")?.addEventListener("click", () => {
        showPage("chatPage");
    });

    loginBtn?.addEventListener("click", loginUser);

    demoLoginBtn?.addEventListener("click", () => {
        usernameInput.value = "Aakash";
        passwordInput.value = "demo";
        loginUser();
    });

    passwordInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            loginUser();
        }
    });

    logoutBtn?.addEventListener("click", logoutUser);

    themeToggleBtn?.addEventListener("click", toggleSoftTheme);

    fileInput?.addEventListener("change", (e) => {
        const file = e.target.files[0];

        if (file) {
            handleFile(file);
        }
    });

    uploadArea?.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
    });

    uploadArea?.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });

    uploadArea?.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");

        const file = e.dataTransfer.files[0];

        if (file) {
            handleFile(file);
        }
    });

    askButton?.addEventListener("click", handleQuery);

    questionInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleQuery();
        }
    });

    questionInput?.addEventListener("input", autoResizeTextarea);

    document.querySelectorAll(".suggestion-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            showPage("chatPage");
            questionInput.value = btn.textContent.trim();
            autoResizeTextarea();
            questionInput.focus();
        });
    });

    dashboardLanguageSelect?.addEventListener("change", (e) => {
        setLanguage(e.target.value);
    });

    settingsLanguageSelect?.addEventListener("change", (e) => {
        setLanguage(e.target.value);
    });

    languageSelect?.addEventListener("change", (e) => {
        setLanguage(e.target.value);
    });

    clearDocsBtn?.addEventListener("click", clearAllDocuments);

    clearChatBtn?.addEventListener("click", () => {
        if (!confirm("Clear current chat?")) return;
        clearChat();
    });

    settingsClearChatBtn?.addEventListener("click", () => {
        if (!confirm("Clear all saved chat history?")) return;
        clearChat();
        alert("Chat history cleared!");
    });

    documentSearchInput?.addEventListener("input", () => {
        renderDocuments(uploadedDocumentsCache);
    });
}

function showPage(pageId) {
    document.querySelectorAll(".page-section").forEach((page) => {
        page.classList.remove("active-page");
    });

    document.querySelectorAll(".menu-btn").forEach((btn) => {
        btn.classList.remove("active");
    });

    document.getElementById(pageId)?.classList.add("active-page");
    document.querySelector(`[data-page="${pageId}"]`)?.classList.add("active");

    if (pageId === "profilePage") {
        updateProfileStats();
    }

    if (pageId === "documentsPage") {
        loadDocuments();
    }

    if (pageId === "chatPage" && chatHistory.length === 0 && welcomeCard) {
        welcomeCard.style.display = "block";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function checkLogin() {
    const user = localStorage.getItem("rag_user");

    if (user) {
        loginModal.style.display = "none";
        setUserName(user);
        showPage("homePage");
    } else {
        loginModal.style.display = "flex";
    }
}

function loginUser() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username) {
        alert("Please enter username");
        return;
    }

    if (!password) {
        alert("Please enter password");
        return;
    }

    localStorage.setItem("rag_user", username);
    loginModal.style.display = "none";

    setUserName(username);
    showPage("homePage");
}

function logoutUser() {
    if (!confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("rag_user");
    location.reload();
}

function setUserName(name) {
    const initial = name.charAt(0).toUpperCase();

    if (currentUser) currentUser.textContent = name;
    if (dashboardUser) dashboardUser.textContent = name;
    if (profileUserName) profileUserName.textContent = name;
    if (profileFullName) profileFullName.textContent = name;

    if (profileAvatar) profileAvatar.textContent = initial;
    if (sidebarAvatar) sidebarAvatar.textContent = initial;
    if (topProfileDot) topProfileDot.textContent = initial;
}

async function handleFile(file) {
    if (isProcessing) return;

    const allowed = ["pdf", "txt", "docx"];
    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowed.includes(ext)) {
        showStatus("Only PDF, TXT and DOCX files are allowed.", "error");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showStatus("File size must be below 10MB.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    showLoading("Uploading and indexing document...");
    isProcessing = true;

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.message || "Upload failed");
        }

        if (data.status !== "success") {
            throw new Error(data.message || "Upload failed");
        }

        const uploadedDoc = {
            filename: data.filename || file.name,
            chunks: data.chunks || 0,
            language: data.detected_language || data.language || "Unknown",
            uploadedAt: new Date().toLocaleString()
        };
        console.log("UPLOAD RESPONSE:", data);
        console.log("SAVING DOC:", uploadedDoc);
        saveUploadedDocument(uploadedDoc);

        showStatus(
            `✅ ${uploadedDoc.filename} uploaded successfully • ${uploadedDoc.chunks} chunks`,
            "success"
        );

        uploadedDocumentsCache = getUploadedDocuments();

        renderDocuments(uploadedDocumentsCache);
        updateLocalDocumentStats();

        await loadStats();
        await updateProfileStats();

        showPage("documentsPage");

    } catch (error) {
        console.error("Upload failed:", error);
        showStatus(`❌ Upload failed: ${error.message}`, "error");
    } finally {
        hideLoading();
        isProcessing = false;

        if (fileInput) {
            fileInput.value = "";
        }
    }
}

async function handleQuery() {
    const question = questionInput.value.trim();

    if (!question || isProcessing) return;

    hideWelcome();
    addMessage("user", question);

    questionInput.value = "";
    autoResizeTextarea();

    isProcessing = true;
    askButton.disabled = true;

    const assistantMsg = renderMessage("assistant", "Typing...");
    const textBox = assistantMsg.querySelector(".message-text");

    const formData = new FormData();
    formData.append("question", question);
    formData.append("language", languageSelect.value);

    try {
        const response = await fetch("/query-stream", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Streaming request failed");
        }

        if (!response.body) {
            throw new Error("Streaming not supported in this browser");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let finalAnswer = "";

        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            for (const char of chunk) {
                finalAnswer += char;
                textBox.innerHTML = formatAnswer(finalAnswer);
                scrollToBottom();
                await sleep(8);
            }
        }

        if (!finalAnswer.trim()) {
            finalAnswer = "No answer generated.";
            textBox.innerHTML = finalAnswer;
        }

        chatHistory.push({
            role: "assistant",
            text: finalAnswer,
            sources: []
        });

        saveChatHistory();
        increaseQueryCount();

    } catch (error) {
        const errorText = `❌ Error: ${error.message}`;
        textBox.innerHTML = errorText;

        chatHistory.push({
            role: "assistant",
            text: errorText,
            sources: []
        });

        saveChatHistory();

    } finally {
        isProcessing = false;
        askButton.disabled = false;
        questionInput.focus();
    }
}

function renderMessage(role, text, sources = []) {
    const message = document.createElement("article");
    message.className = `message ${role}`;

    const avatar = role === "user" ? "🧑" : "🤖";
    const title = role === "user" ? "You" : "Assistant";

    message.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="message-body">
            <div class="message-title">${title}</div>
            <div class="message-text">${formatAnswer(text)}</div>
            ${renderSources(sources)}
        </div>
    `;

    chatWindow.appendChild(message);
    scrollToBottom();

    return message;
}

function addMessage(role, text, sources = []) {
    const message = renderMessage(role, text, sources);

    chatHistory.push({
        role,
        text,
        sources
    });

    saveChatHistory();

    return message;
}

function saveChatHistory() {
    localStorage.setItem("rag_chat_history", JSON.stringify(chatHistory));
}

function loadChatHistory() {
    const saved = localStorage.getItem("rag_chat_history");

    if (!saved) {
        if (welcomeCard) welcomeCard.style.display = "block";
        return;
    }

    try {
        chatHistory = JSON.parse(saved);

        if (chatHistory.length > 0) {
            hideWelcome();

            chatHistory.forEach((msg) => {
                renderMessage(msg.role, msg.text, msg.sources || []);
            });
        } else {
            if (welcomeCard) welcomeCard.style.display = "block";
        }
    } catch (error) {
        console.error("History load failed:", error);

        localStorage.removeItem("rag_chat_history");
        chatHistory = [];

        if (welcomeCard) {
            welcomeCard.style.display = "block";
        }
    }
}

function clearChat() {
    chatHistory = [];
    localStorage.removeItem("rag_chat_history");

    if (chatWindow) {
        chatWindow.innerHTML = "";
    }

    if (welcomeCard) {
        welcomeCard.style.display = "block";
        chatWindow.appendChild(welcomeCard);
    }

    updateQueryCount();
}

function hideWelcome() {
    if (welcomeCard) {
        welcomeCard.style.display = "none";
    }
}

async function loadStats() {
    try {
        const response = await fetch("/stats");
        const data = await response.json();

        const chunks = data.total_chunks || 0;
        const model = data.llm_model || "Ollama";

        if (totalChunks) totalChunks.textContent = chunks;
        if (modelName) modelName.textContent = model;

        if (dashChunksCount) dashChunksCount.textContent = chunks;

    } catch (error) {
        console.error("Stats load failed:", error);
    }
}

async function loadDocuments() {
    let localDocs = getUploadedDocuments();

    try {
        const response = await fetch("/documents");
        const data = await response.json();

        const backendDocs = data.documents || [];

        const mergedDocs = mergeDocuments(localDocs, backendDocs);

        uploadedDocumentsCache = mergedDocs;
        localStorage.setItem("uploaded_documents", JSON.stringify(mergedDocs));

        renderDocuments(mergedDocs);
        updateLocalDocumentStats();

    } catch (error) {
        console.error("Documents API failed, using local documents:", error);

        uploadedDocumentsCache = localDocs;
        renderDocuments(localDocs);
        updateLocalDocumentStats();
    }
}
function renderDocuments(documents) {
    if (!uploadsList) return;

    const searchText = documentSearchInput?.value?.toLowerCase() || "";

    const filteredDocs = documents.filter((doc) => {
        return (doc.filename || "").toLowerCase().includes(searchText);
    });

    uploadsList.innerHTML = "";

    if (!filteredDocs.length) {
        uploadsList.innerHTML = `<p class="empty-text">No files uploaded yet.</p>`;
        return;
    }

    filteredDocs.forEach((doc) => {
        const ext = (doc.filename || "").split(".").pop().toLowerCase();

        let icon = "📄";
        if (ext === "pdf") icon = "📕";
        if (ext === "docx") icon = "📘";
        if (ext === "txt") icon = "📗";

        const item = document.createElement("div");
        item.className = "upload-item";

        item.innerHTML = `
            <div class="doc-card-head">
                <div class="doc-icon">${icon}</div>
                <button class="delete-doc-btn" type="button">Delete</button>
            </div>

            <strong>${escapeHtml(doc.filename || "Document")}</strong>

            <span>${doc.chunks || 0} chunks • ${escapeHtml(doc.language || "Unknown")}</span>

            <small>Uploaded: ${escapeHtml(doc.uploadedAt || "Recently")}</small>
        `;

        item.querySelector(".delete-doc-btn")?.addEventListener("click", () => {
            deleteLocalDocument(doc.filename);
        });

        uploadsList.appendChild(item);
    });
}

async function deleteDocument(filename) {
    if (!filename) return;

    if (!confirm(`Delete ${filename}?`)) return;

    try {
        const response = await fetch(`/documents/${encodeURIComponent(filename)}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        await loadDocuments();
        await loadStats();
        await updateProfileStats();

    } catch (error) {
        alert("Delete failed: " + error.message);
    }
}

async function clearAllDocuments() {
    if (!confirm("Clear all uploaded documents?")) return;

    try {
        const response = await fetch("/clear", {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Clear failed");
        }

        // Backend clear ke baad frontend/local list bhi clear
        localStorage.removeItem("uploaded_documents");

        uploadedDocumentsCache = [];

        if (uploadsList) {
            uploadsList.innerHTML = `<p class="empty-text">No files uploaded yet.</p>`;
        }

        updateLocalDocumentStats();

        await loadStats();
        await updateProfileStats();

        alert("All documents cleared.");

    } catch (error) {
        // Agar backend clear fail ho, tab bhi frontend list clean karne ka option
        console.error("Clear failed:", error);

        localStorage.removeItem("uploaded_documents");
        uploadedDocumentsCache = [];

        if (uploadsList) {
            uploadsList.innerHTML = `<p class="empty-text">No files uploaded yet.</p>`;
        }

        updateLocalDocumentStats();

        alert("Documents list cleared from frontend. Backend clear failed: " + error.message);
    }
}

async function updateProfileStats() {
    try {
        const statsRes = await fetch("/stats");
        const stats = await statsRes.json();

        const docs = getUploadedDocuments();

        const docsCount = docs.length;

        const localChunks = docs.reduce((sum, doc) => {
            return sum + Number(doc.chunks || 0);
        }, 0);

        const totalChunkCount = stats.total_chunks || localChunks || 0;

        document.getElementById("profileDocsCount").textContent = docsCount;
        document.getElementById("profileChunksCount").textContent = totalChunkCount;
        document.getElementById("profileModelName").textContent = stats.llm_model || "Ollama";

        if (dashDocsCount) dashDocsCount.textContent = docsCount;
        if (dashChunksCount) dashChunksCount.textContent = totalChunkCount;

    } catch (error) {
        console.error("Profile stats update failed:", error);
        updateLocalDocumentStats();
    }
}

function setLanguage(lang) {
    if (languageSelect) languageSelect.value = lang;
    if (settingsLanguageSelect) settingsLanguageSelect.value = lang;
    if (dashboardLanguageSelect) dashboardLanguageSelect.value = lang;

    localStorage.setItem("default_language", lang);
}

function loadSavedLanguage() {
    const lang = localStorage.getItem("default_language") || "en";
    setLanguage(lang);
}

function toggleSoftTheme() {
    document.body.classList.toggle("soft-dark");

    const isDark = document.body.classList.contains("soft-dark");
    localStorage.setItem("soft_theme", isDark ? "dark" : "light");

    if (themeToggleBtn) {
        themeToggleBtn.textContent = isDark ? "☾" : "☀";
    }
}

function loadSoftTheme() {
    const theme = localStorage.getItem("soft_theme") || "light";

    document.body.classList.toggle("soft-dark", theme === "dark");

    if (themeToggleBtn) {
        themeToggleBtn.textContent = theme === "dark" ? "☾" : "☀";
    }
}

function showStatus(message, type) {
    if (!uploadStatus) return;

    uploadStatus.textContent = message;
    uploadStatus.className = `status-message ${type}`;

    setTimeout(() => {
        uploadStatus.textContent = "";
        uploadStatus.className = "status-message";
    }, 5000);
}

function showLoading(text) {
    if (!loadingOverlay) return;

    loadingText.textContent = text;
    loadingOverlay.classList.add("active");
}

function hideLoading() {
    if (!loadingOverlay) return;

    loadingOverlay.classList.remove("active");
}

function autoResizeTextarea() {
    if (!questionInput) return;

    questionInput.style.height = "auto";
    questionInput.style.height = Math.min(questionInput.scrollHeight, 140) + "px";
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        if (chatWindow) {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    });
}

function renderSources(sources) {
    if (!sources || sources.length === 0) return "";

    const items = sources.map((source, index) => {
        return `
            <div class="source-item">
                <strong>Source ${index + 1}: ${escapeHtml(source.source || "Unknown")}</strong>
                <p>${escapeHtml(source.content || "")}</p>
            </div>
        `;
    }).join("");

    return `
        <details class="sources-details">
            <summary>📚 View Sources</summary>
            ${items}
        </details>
    `;
}

function formatAnswer(text) {
    let safe = escapeHtml(text || "");

    safe = safe.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    safe = safe.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/^-\s+(.*)$/gim, "<div>• $1</div>");
    safe = safe.replace(/\n/g, "<br>");

    return safe;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function increaseQueryCount() {
    const current = Number(localStorage.getItem("rag_query_count") || "0");
    localStorage.setItem("rag_query_count", String(current + 1));
    updateQueryCount();
}

function updateQueryCount() {
    const current = Number(localStorage.getItem("rag_query_count") || "0");

    if (dashQueriesCount) {
        dashQueriesCount.textContent = current;
    }
}

loadSoftTheme();

function saveUploadedDocument(doc) {
    const savedDocs = JSON.parse(localStorage.getItem("uploaded_documents") || "[]");

    const exists = savedDocs.some(item => item.filename === doc.filename);

    if (!exists) {
        savedDocs.unshift(doc);
    }

    localStorage.setItem("uploaded_documents", JSON.stringify(savedDocs));
    uploadedDocumentsCache = savedDocs;

    renderDocuments(savedDocs);
    updateLocalDocumentStats();
}

function getUploadedDocuments() {
    return JSON.parse(localStorage.getItem("uploaded_documents") || "[]");
}

function updateLocalDocumentStats() {
    const docs = getUploadedDocuments();

    if (dashDocsCount) {
        dashDocsCount.textContent = docs.length;
    }

    const totalLocalChunks = docs.reduce((sum, doc) => {
        return sum + Number(doc.chunks || 0);
    }, 0);

    if (dashChunksCount) {
        dashChunksCount.textContent = totalLocalChunks;
    }

    const profileDocsCount = document.getElementById("profileDocsCount");
    const profileChunksCount = document.getElementById("profileChunksCount");

    if (profileDocsCount) {
        profileDocsCount.textContent = docs.length;
    }

    if (profileChunksCount) {
        profileChunksCount.textContent = totalLocalChunks;
    }
}

function deleteLocalDocument(filename) {
    if (!confirm(`Remove ${filename} from frontend list?`)) return;

    let docs = getUploadedDocuments();
    docs = docs.filter(doc => doc.filename !== filename);

    localStorage.setItem("uploaded_documents", JSON.stringify(docs));

    uploadedDocumentsCache = docs;
    renderDocuments(docs);
    updateLocalDocumentStats();
}

function mergeDocuments(localDocs, backendDocs) {
    const map = new Map();

    localDocs.forEach((doc) => {
        if (doc.filename) {
            map.set(doc.filename, doc);
        }
    });

    backendDocs.forEach((doc) => {
        const filename = doc.filename || doc.source;

        if (filename && !map.has(filename)) {
            map.set(filename, {
                filename,
                chunks: doc.chunks || 0,
                language: doc.language || "Unknown",
                uploadedAt: doc.uploadedAt || "Recently"
            });
        }
    });

    return Array.from(map.values());
}

function saveUploadedDocument(doc) {
    const docs = getUploadedDocuments();

    const exists = docs.some((item) => item.filename === doc.filename);

    if (!exists) {
        docs.unshift(doc);
    }

    localStorage.setItem("uploaded_documents", JSON.stringify(docs));

    uploadedDocumentsCache = docs;
    renderDocuments(docs);
    updateLocalDocumentStats();
}

function getUploadedDocuments() {
    try {
        return JSON.parse(localStorage.getItem("uploaded_documents") || "[]");
    } catch {
        return [];
    }
}