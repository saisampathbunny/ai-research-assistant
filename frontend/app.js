const BASE_URL = "http://localhost:8000";

let currentMode = "";
let sessionId = "";
let sourceLabel = "";
let messages = [];


const modeScreen = document.getElementById("mode-screen");
const loaderScreen = document.getElementById("loader-screen");
const chatScreen = document.getElementById("chat-screen");

const pdfButton = document.getElementById("pdf-btn");
const wikipediaButton = document.getElementById("wiki-btn");

const backButton = document.getElementById("back-btn");
const loaderForm = document.getElementById("loader-form");

const pdfInput = document.getElementById("pdf-input");
const topicInput = document.getElementById("topic-input");

const pdfLoader = document.getElementById("pdf-loader");
const wikipediaLoader = document.getElementById("wiki-loader");

const loaderError = document.getElementById("loader-error");

const sourceLabelElement = document.getElementById("source-label");
const messagesContainer = document.getElementById("messages");

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const typingIndicator = document.getElementById("typing-indicator");
const resetButton = document.getElementById("reset-btn");


function showScreen(screen)
{
    modeScreen.classList.add("hidden");
    loaderScreen.classList.add("hidden");
    chatScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}


function showLoaderFields()
{
    pdfLoader.classList.add("hidden");
    wikipediaLoader.classList.add("hidden");

    if (currentMode === "pdf")
    {
        pdfLoader.classList.remove("hidden");
    }
    else if (currentMode === "wikipedia")
    {
        wikipediaLoader.classList.remove("hidden");
    }
}


function selectPdfMode()
{
    currentMode = "pdf";

    loaderError.textContent = "";

    showLoaderFields();
    showScreen(loaderScreen);
}


function selectWikipediaMode()
{
    currentMode = "wikipedia";

    loaderError.textContent = "";

    showLoaderFields();
    showScreen(loaderScreen);
}


function goBack()
{
    loaderError.textContent = "";

    showScreen(modeScreen);
}


async function createSession()
{
    const response = await fetch(`${BASE_URL}/api/session/new`,
    {
        method: "POST"
    });

    const data = await response.json();

    if (!response.ok)
    {
        throw new Error(data.detail || "Failed to create session.");
    }

    sessionId = data.session_id;

    return sessionId;
}


async function uploadPdf(file)
{
    const formData = new FormData();

    formData.append("session_id", sessionId);
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/api/pdf/upload`,
    {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    if (!response.ok)
    {
        throw new Error(data.detail || "Failed to upload PDF.");
    }

    return data;
}


async function loadWikipedia(topic)
{
    const response = await fetch(`${BASE_URL}/api/wikipedia/load`,
    {
        method: "POST",

        headers:
        {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(
        {
            session_id: sessionId,
            topic: topic
        })
    });

    const data = await response.json();

    if (!response.ok)
    {
        throw new Error(data.detail || "Failed to load Wikipedia.");
    }

    return data;
}


async function sendChatMessage(message)
{
    const response = await fetch(`${BASE_URL}/api/chat`,
    {
        method: "POST",

        headers:
        {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(
        {
            session_id: sessionId,
            message: message
        })
    });

    const data = await response.json();

    if (!response.ok)
    {
        throw new Error(data.detail || "Failed to get response.");
    }

    return data;
}


async function startPdfChat(file)
{
    if (!file)
    {
        throw new Error("Please select a PDF file.");
    }

    if (file.type !== "application/pdf")
    {
        throw new Error("Please select a valid PDF file.");
    }

    await createSession();

    await uploadPdf(file);

    sourceLabel = file.name;

    messages = [];

    updateSourceLabel();
    renderMessages();

    showScreen(chatScreen);
}


async function startWikipediaChat(topic)
{
    if (!topic.trim())
    {
        throw new Error("Please enter a Wikipedia topic.");
    }

    await createSession();

    await loadWikipedia(topic.trim());

    sourceLabel = `Wikipedia: ${topic.trim()}`;

    messages = [];

    updateSourceLabel();
    renderMessages();

    showScreen(chatScreen);
}


function updateSourceLabel()
{
    sourceLabelElement.textContent = sourceLabel;
}


function addMessage(role, content, sources = [])
{
    messages.push(
    {
        role: role,
        content: content,
        sources: sources
    });
}


function renderMessages()
{
    messagesContainer.innerHTML = "";

    messages.forEach(function(message)
    {
        const messageElement = createMessageElement(message);

        messagesContainer.appendChild(messageElement);
    });

    scrollToBottom();
}


function createMessageElement(message)
{
    const wrapper = document.createElement("div");

    wrapper.className = `message ${message.role}`;

    const content = document.createElement("div");

    content.className = "message-content";

    content.textContent = message.content;

    wrapper.appendChild(content);

    if (message.role === "assistant" && message.sources)
    {
        if (message.sources.length > 0)
        {
            const sourcesPanel = createSourcesPanel(message.sources);

            wrapper.appendChild(sourcesPanel);
        }
    }

    return wrapper;
}


function createSourcesPanel(sources)
{
    const panel = document.createElement("div");

    panel.className = "sources-panel";

    const button = document.createElement("button");

    button.className = "sources-toggle";

    button.textContent = `Sources (${sources.length})`;

    const sourceList = document.createElement("div");

    sourceList.className = "source-list hidden";

    sources.forEach(function(source, index)
    {
        const sourceItem = createSourceItem(source, index);

        sourceList.appendChild(sourceItem);
    });

    button.addEventListener("click", function()
    {
        sourceList.classList.toggle("hidden");
    });

    panel.appendChild(button);
    panel.appendChild(sourceList);

    return panel;
}


function createSourceItem(source, index)
{
    const item = document.createElement("div");

    item.className = "source-item";

    const sourceName = document.createElement("div");

    sourceName.className = "source-label-small";

    const sourceValue =
        source.metadata && source.metadata.source
            ? source.metadata.source
            : "Unknown source";

    sourceName.textContent = `${index + 1}. ${sourceValue}`;

    const chunkIndex = document.createElement("div");

    chunkIndex.className = "source-label-small";

    if (source.chunk_index !== undefined)
    {
        chunkIndex.textContent = `Chunk: ${source.chunk_index}`;
    }

    const sourceText = document.createElement("p");

    sourceText.textContent = source.text || "";

    item.appendChild(sourceName);
    item.appendChild(chunkIndex);
    item.appendChild(sourceText);

    return item;
}


function showTyping()
{
    typingIndicator.classList.remove("hidden");

    scrollToBottom();
}


function hideTyping()
{
    typingIndicator.classList.add("hidden");
}


function scrollToBottom()
{
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


async function handleLoaderSubmit(event)
{
    event.preventDefault();

    loaderError.textContent = "";

    try
    {
        if (currentMode === "pdf")
        {
            const file = pdfInput.files[0];

            await startPdfChat(file);
        }
        else if (currentMode === "wikipedia")
        {
            const topic = topicInput.value;

            await startWikipediaChat(topic);
        }
    }
    catch (error)
    {
        loaderError.textContent = error.message;
    }
}


async function handleChatSubmit(event)
{
    event.preventDefault();

    const message = chatInput.value.trim();

    if (!message)
    {
        return;
    }

    chatInput.value = "";

    addMessage("user", message);

    renderMessages();

    showTyping();

    try
    {
        const response = await sendChatMessage(message);

        const answer = response.answer || "No answer received.";

        const sources = response.sources || [];

        addMessage("assistant", answer, sources);

        renderMessages();
    }
    catch (error)
    {
        addMessage(
            "assistant",
            `Error: ${error.message}`
        );

        renderMessages();
    }
    finally
    {
        hideTyping();
    }
}


function resetApplication()
{
    currentMode = "";
    sessionId = "";
    sourceLabel = "";
    messages = [];

    pdfInput.value = "";
    topicInput.value = "";
    chatInput.value = "";

    loaderError.textContent = "";

    updateSourceLabel();

    renderMessages();

    showScreen(modeScreen);
}


function initializeApplication()
{
    pdfButton.addEventListener("click", selectPdfMode);

    wikipediaButton.addEventListener("click", selectWikipediaMode);

    backButton.addEventListener("click", goBack);

    loaderForm.addEventListener("submit", handleLoaderSubmit);

    chatForm.addEventListener("submit", handleChatSubmit);

    resetButton.addEventListener("click", resetApplication);

    showScreen(modeScreen);
}


initializeApplication();
