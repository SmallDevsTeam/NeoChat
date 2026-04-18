const socket = io();

const input = document.querySelector("textarea");
const button = document.querySelector("button");
const chatBox = document.querySelector(".chat-box");
const popup = document.querySelector('.popup');
const cancelBtn = document.querySelector("#cancel");

// Input styling
input.addEventListener('input', (e) => {
  const content = e.target.value.replace(/\s/g, "");
  button.style.backgroundColor = content.length > 0 ? "#2e60ff" : "#2f2f2f";
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
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/__(.*?)__/g, "<u>$1</u>")
    .replace(/~~(.*?)~~/g, "<s>$1</s>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/^#\s+(.*)$/gm, "<h1>$1</h1>")
    .replace(/^##\s+(.*)$/gm, "<h2>$1</h2>")
    .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
}

function formatURL(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

function handleMessage(msg, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);

  let result = formatMessage(msg);
  result = formatURL(result);

  div.innerHTML = result;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

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
    button.style.backgroundColor = "#2f2f2f";
    socket.emit("chat message", msg);
    input.value = "";
    handleMessage(msg, "received");
  }
});