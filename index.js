const mineflayer = require("mineflayer");
const AutoAuth = require("mineflayer-auto-auth");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const PANEL_PASSWORD = "admin123"; // ← CHANGE THIS!

let bot = null;
let lastPing = 0;
let lastTPS = 20;

// ====================== EXPRESS SETUP ======================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // optional, for future CSS

app.use(session({
  secret: "supersecretkeychangeinproduction",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

function isAuthenticated(req, res, next) {
  if (req.session.loggedIn) return next();
  res.redirect("/login");
}

// ====================== BOT FUNCTION ======================
function createBot() {
  if (bot) {
    bot.quit();
    bot = null;
  }

  bot = mineflayer.createBot({
    host: "play-LOVE.aternos.me",
    port: 50294,
    username: "BOT_XD",
    onlineMode: false,
    version: false,           // Auto detect
    plugins: [AutoAuth],
    AutoAuth: "bot112022"     // Your server password
  });

  bot.once("spawn", () => {
    console.log("✅ Bot successfully joined the server!");
  });

  // Anti-AFK (jumps every 25 seconds)
  setInterval(() => {
    if (!bot?.entity) return;
    bot.setControlState("jump", true);
    setTimeout(() => bot.setControlState("jump", false), 250);
  }, 25000);

  bot.on("time", () => {
    if (bot.time?.delta) {
      lastTPS = (20 / bot.time.delta).toFixed(2);
    }
  });

  bot.on("physicTick", () => {
    if (bot.player?.ping !== undefined) {
      lastPing = bot.player.ping;
    }
  });

  bot.on("end", (reason) => {
    console.log(`Bot disconnected (${reason}). Reconnecting in 10 seconds...`);
    setTimeout(createBot, 10000);
  });

  bot.on("error", (err) => {
    console.log("Bot error:", err.message);
  });

  bot.on("kicked", (reason) => {
    console.log("Kicked from server:", reason);
  });
}

// Start the bot
createBot();

// ====================== ROUTES ======================

// Login Page
app.get("/login", (req, res) => {
  res.send(`
    <h2>🔐 Developer Login</h2>
    <form method="POST" action="/login">
      <input type="password" name="password" placeholder="Enter Password" style="padding:10px; width:250px;"/>
      <button type="submit" style="padding:10px;">Login</button>
    </form>
  `);
});

app.post("/login", (req, res) => {
  if (req.body.password === PANEL_PASSWORD) {
    req.session.loggedIn = true;
    res.redirect("/");
  } else {
    res.send("❌ Wrong password! <br><a href='/login'>Try again</a>");
  }
});

// Main Panel
app.get("/", isAuthenticated, (req, res) => {
  const players = bot?.players ? Object.keys(bot.players) : [];
  const status = bot?.entity ? "🟢 ONLINE" : "🔴 OFFLINE";

  res.send(`
    <h1>🤖 Minecraft Bot Panel</h1>
    <p><strong>Status:</strong> ${status}</p>
    <p><strong>Ping:</strong> ${lastPing} ms</p>
    <p><strong>TPS:</strong> ${lastTPS}</p>
    <p><strong>Players Online:</strong> ${players.length}</p>
    <p><strong>Players:</strong> ${players.join(", ") || "No players"}</p>

    <hr>
    <h3>Send Chat Message</h3>
    <form method="POST" action="/chat">
      <input name="message" placeholder="Type message..." style="width:300px; padding:8px;"/>
      <button type="submit">Send</button>
    </form>

    <br>
    <a href="/reconnect"><button>🔄 Reconnect Bot</button></a>
    <a href="/restart"><button>♻️ Restart Container</button></a>
    <a href="/logout"><button>Logout</button></a>
  `);
});

// Send Chat
app.post("/chat", isAuthenticated, (req, res) => {
  if (bot?.chat && req.body.message) {
    bot.chat(req.body.message);
  }
  res.redirect("/");
});

// Reconnect Bot
app.get("/reconnect", isAuthenticated, (req, res) => {
  console.log("Manual reconnect requested");
  createBot();
  res.redirect("/");
});

// Restart Container
app.get("/restart", isAuthenticated, (req, res) => {
  res.send("Restarting container...");
  setTimeout(() => process.exit(1), 500);
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Developer Panel running on http://localhost:${PORT}`);
});
