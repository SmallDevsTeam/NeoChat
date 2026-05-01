const socket = io();
let username = prompt("What is your name?");

const input = document.querySelector("textarea");
const button = document.querySelector("button");
const chatBox = document.querySelector(".chat-box");
const popup = document.querySelector('.popup');
const cancelBtn = document.querySelector("#cancel");

// Input styling
input.addEventListener('input', (e) => {
  const content = e.target.value.replace(/\s/g, "");
  button.style.backgroundColor = content.length > 0 ? "#2e60ff" : "#131419";
});

cancelBtn.addEventListener("click", () => {
  popup.classList.remove("active"); // hide
});

popup.addEventListener("click", (e) => {
  if (e.target === popup) {
    popup.classList.remove("active"); // hide
  }
});

popup.querySelector('a').addEventListener('click',(e) => {
    window.location.href = e.target.href;
});

// Handle link clicks
document.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    e.preventDefault();
    popup.querySelector('h1').textContent = "Are You sure you want to visit "+ e.target.href;
    popup.querySelector('p').textContent = "Make sure you trust this source before continuing, Neochat is not responsible.";
    popup.querySelector('a').textContent = "Continue Anyway";
    popup.querySelector('a').href = e.target.href;
    popup.classList.add('active'); //show
  }
});

function formatMessage(text) {
  const codeBlocks = [];

  // 1. Extract code blocks
  text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
    const id = codeBlocks.length;
    codeBlocks.push(code);
    return `@@CODEBLOCK_${id}@@`;
  });

  // 2. Escape HTML
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 3. Formatting
  text = text
    // custom span FIRST
    .replace(/^-#\s+(.+)$/gm, "<span class='subtext'>$1</span>")

    // headings (ORDER MATTERS)
    .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")

    // markdown
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/__(.*?)__/g, "<u>$1</u>")
    .replace(/~~(.*?)~~/g, "<s>$1</s>")
    .replace(/`([^`\n]+)`/g, "<code class='inline-code'>$1</code>")

    // line breaks
    .replace(/\n/g, "<br>");

  // 4. Restore code blocks (raw)
  codeBlocks.forEach((code, i) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    text = text.replace(
      `@@CODEBLOCK_${i}@@`,
      `<pre><code>${escaped}</code></pre>`
    );
  });

  return text;
}

function formatURL(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
};

function handleMessage(msg, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);

  let result = formatMessage(msg);
  result = formatURL(result);

  div.innerHTML = result;
  chatBox.appendChild(div);

  // Highlight + copy buttons
  div.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);

    const pre = block.parentElement;

    // avoid duplicate buttons
    if (pre.querySelector(".copy-btn")) return;

    const btn = document.createElement("button");
    btn.classList.add("copy-btn");
    btn.innerHTML = `<img src="public/copy.svg" alt="copy">`;

    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(block.innerText);

      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.innerHTML = `<img src="public/copy.svg" alt="copy">`;
      }, 1200);
    });

    pre.appendChild(btn);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
};

socket.on("chat message", (msg) => {
  handleMessage(msg, "sent");
});

socket.on("chat data", (data) => {
  data.forEach(msg => handleMessage(msg, "sent"));
});

socket.on('denied', (error) => {
  alert('your message failed!');
});

button.addEventListener("click", () => {
  const msg = input.value;

  if (msg.trim() !== "") {
    button.style.backgroundColor = "#131419";
    socket.emit("chat message", `${username}: ${msg}`);
    input.value = "";
    handleMessage(`${username}: ${msg}`, "received");
  }
});