require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

const bot = new TelegramBot(token, { polling: true });

/* ================= DATA ================= */

function loadRecords() {
  return JSON.parse(fs.readFileSync("numbers.json", "utf8"));
}

function saveRecords(data) {
  fs.writeFileSync("numbers.json", JSON.stringify(data, null, 2));
}

/* ================= HELPERS ================= */

function generateVirtualLine(state) {
  const areaCodes = {
    California: "415",
    "New York": "212",
    Texas: "713",
    Florida: "305",
    Illinois: "312",
    Washington: "206",
    Arizona: "602"
  };

  const area = areaCodes[state] || "000";
  const mid = Math.floor(200 + Math.random() * 700);
  const last = Math.floor(1000 + Math.random() * 9000);

  return `+1 ${area} ${mid} ${last} (VIRTUAL LINE)`;
}

function generatePreviewNumber(state) {
  const areaCodes = {
    California: "415",
    "New York": "212",
    Texas: "713",
    Florida: "305",
    Illinois: "312",
    Washington: "206",
    Arizona: "602"
  };

  const area = areaCodes[state] || "000";
  const mid = Math.floor(200 + Math.random() * 700);
  const last = Math.floor(1000 + Math.random() * 9000);

  return `+1 ${area} ${mid} ${last}`;
}
function showNumbersPage(chatId, page = 0) {
  const records = loadRecords();

  const perPage = 3;
  const start = page * perPage;
  const end = start + perPage;

  const pageRecords = records.slice(start, end);

  let message = "📡 US VIRTUAL NUMBER POOLS\n\n";

  pageRecords.forEach(r => {
    const available = r.available - r.sold;

    message +=
`🆔 ID: ${r.id}
🌎 State: ${r.state}
📶 Type: ${r.type}
🏢 Carrier: ${r.carrier}
💰 Price: $${r.price}
📦 Available: ${available}

`;
  });

  const buttons = [];

  pageRecords.forEach(r => {
    buttons.push([
      {
        text: `🛒 Buy ${r.state}`,
        callback_data: `buy_${r.id}`
      }
    ]);
  });

  const nav = [];

  if (page > 0) {
    nav.push({
      text: "⬅️ Previous",
      callback_data: `page_${page - 1}`
    });
  }

  if (end < records.length) {
    nav.push({
      text: "➡️ Next",
      callback_data: `page_${page + 1}`
    });
  }

  if (nav.length) buttons.push(nav);

  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}
/* ================= START ================= */

bot.onText(/\/start/, (msg) => {

  bot.sendMessage(msg.chat.id,
`👋 Welcome to US Virtual Network

Select an option below to continue:`,
{
  reply_markup: {
    keyboard: [
      ["📡 View States", "🛒 My Orders"],
      ["💳 Payment Help", "ℹ️ Support"]
    ],
    resize_keyboard: true
  }
});

});
bot.on("message", (msg) => {

  const text = msg.text;

  if (text === "📡 View States") {
    bot.sendMessage(msg.chat.id, "Use /numbers to view available states.");
  }

  if (text === "🛒 My Orders") {
    bot.sendMessage(msg.chat.id, "🧾 You have no active order tracking yet.");
  }

  if (text === "💳 Payment Help") {
    bot.sendMessage(msg.chat.id,
`💳 PAYMENT HELP

M-Pesa: +254740873261 (Janet)
Crypto: Wallet shown at checkout

After payment click "I've Paid".`);
  }

  if (text === "ℹ️ Support") {
    bot.sendMessage(msg.chat.id,
`📞 Support

Contact admin for help.`);
  }

});
/* ================= LIST ================= */

bot.onText(/\/numbers/, (msg) => {
  showNumbersPage(msg.chat.id, 0);
});

/* ================= CALLBACKS ================= */

bot.on("callback_query", (query) => {

  const chatId = query.message.chat.id;
  const data = query.data;

  const records = loadRecords();
/* ===== PAGINATION ===== */
if (data.startsWith("page_")) {

  const page = parseInt(data.split("_")[1]);

  showNumbersPage(chatId, page);

  bot.answerCallbackQuery(query.id);

  return;
}
  /* ===== BUY ===== */
  if (data.startsWith("buy_")) {

    const id = parseInt(data.split("_")[1]);
    const item = records.find(r => r.id === id);

    if (!item) return;

    bot.sendMessage(chatId,
`🟡 CHECKOUT

🌎 State: ${item.state}
💰 Price: $${item.price}

📱 Preview Number:
${generatePreviewNumber(item.state)}

Choose payment method:`,
{
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🟢 M-Pesa", callback_data: `mpesa_${id}` },
        { text: "🟠 Crypto", callback_data: `crypto_${id}` }
      ]
    ]
  }
});

    return;
  }

  /* ===== MPESA ===== */
  if (data.startsWith("mpesa_")) {

    const id = parseInt(data.split("_")[1]);
    const item = records.find(r => r.id === id);

    if (!item) return;

    bot.sendMessage(chatId,
`🟢 M-PESA PAYMENT INSTRUCTIONS

📦 State: ${item.state}
💰 Amount: $${item.price}

📲 Pay to:
+254740873261 (Janet)

⚠️ After payment click below.`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ I've Paid", callback_data: `paid_${id}` }]
    ]
  }
});

    return;
  }

  /* ===== CRYPTO ===== */
  if (data.startsWith("crypto_")) {

    const id = parseInt(data.split("_")[1]);
    const item = records.find(r => r.id === id);

    if (!item) return;

    bot.sendMessage(chatId,
`🟠 CRYPTO PAYMENT

📦 State: ${item.state}
💰 Amount: $${item.price}

Send to wallet:
(WALLET ADDRESS HERE)

⚠️ Then click below.`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ I've Paid", callback_data: `paid_${id}` }]
    ]
  }
});

    return;
  }

  /* ===== PAYMENT SUBMITTED ===== */
  if (data.startsWith("paid_")) {

    const id = parseInt(data.split("_")[1]);

    const item = records.find(r => r.id == id);

    bot.sendMessage(ADMIN_ID,
`⚠️ PAYMENT SUBMITTED

🧾 Order ID: ${id}
🌎 State: ${item.state}
💰 Amount: $${item.price}

👤 User ID: ${chatId}

👉 Approve or Reject below.`,
{
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🟢 Approve", callback_data: `approve_${chatId}_${id}` },
        { text: "🔴 Reject", callback_data: `reject_${chatId}_${id}` }
      ]
    ]
  }
});

    bot.sendMessage(chatId,
`⏳ Payment received. Awaiting confirmation...`);

    return;
  }

  /* ===== APPROVE ===== */
  if (data.startsWith("approve_")) {

    const [, userId, id] = data.split("_");
    const item = records.find(r => r.id == id);

    if (!item) return;

    item.sold += 1;
    saveRecords(records);

    bot.sendMessage(userId,
`🟢 TELECOM PROVISIONING DASHBOARD

━━━━━━━━━━━━━━━━━━
📡 SERVICE ACTIVE
🧾 ORDER ID: ${item.id}
━━━━━━━━━━━━━━━━━━

🌎 STATE: ${item.state}
📶 TYPE: ${item.type}
🏢 CARRIER: ${item.carrier}

📱 ASSIGNED LINE:
${generateVirtualLine(item.state)}

🔐 STATUS: ACTIVE
━━━━━━━━━━━━━━━━━━`);

    bot.sendMessage(ADMIN_ID, "✅ Sale completed");

    return;
  }

  /* ===== REJECT ===== */
  if (data.startsWith("reject_")) {
    bot.sendMessage(ADMIN_ID, "❌ Payment rejected");
  }

});

console.log("✅ Bot running...");
