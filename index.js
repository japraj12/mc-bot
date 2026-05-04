const mineflayer = require("mineflayer");
const AutoAuth = require("mineflayer-auto-auth");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 8080;
const PANEL_PASSWORD = "Paramjap@1217";

let bot;
let lastPing = 0;
let lastTPS = 20;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true
}));

function auth(req, res, next) {
    if (req.session.loggedIn) return next();
    res.redirect("/login");
}

function createBot() {
    // Prevent double-init
    if (bot) {
        try { bot.end(); } catch (e) {}
    }

    console.log("🚀 Attempting to connect to Aternos...");
    
    bot = mineflayer.createBot({
        host: "larpingmc.aternos.me", // Updated to your server
        port: 35370,                 // UPDATE THIS PORT TO MATCH ATERNOS
        username: "Larping_Bot",
        version: "1.21.1",
        plugins: [AutoAuth],
        AutoAuth: "bot112022" 
    });

    bot.on("spawn", () => {
        console.log("✅ Bot joined the server!");
    });

    bot.on("chat", (username, message) => {
        console.log(`[Chat] ${username}: ${message}`);
    });

    bot.on("error", (err) => {
        console.log("❌ Bot error:", err.code);
    });

    bot.on("end", () => {
        console.log("🔌 Disconnected. Retrying in 15 seconds...");
        setTimeout(createBot, 15000);
    });
}

createBot();

// --- WEB PANEL ROUTES ---
app.get("/login", (req, res) => {
    res.send(`<h2>🔐 Dev Login</h2><form method="POST"><input type="password" name="password"/><button>Login</button></form>`);
});

app.post("/login", (req, res) => {
    if (req.body.password === PANEL_PASSWORD) {
        req.session.loggedIn = true;
        return res.redirect("/");
    }
    res.send("Wrong password");
});

app.get("/", auth, (req, res) => {
    const status = bot?.entity ? "🟢 ONLINE" : "🔴 OFFLINE";
    res.send(`
        <h1>🤖 LarpingMC Bot Panel</h1>
        <p>Status: ${status}</p>
        <form method="POST" action="/chat">
            <input name="message" placeholder="Message..."/>
            <button>Send</button>
        </form>
        <br/><a href="/reconnect">Force Reconnect</a>
    `);
});

app.post("/chat", auth, (req, res) => {
    if (bot?.chat) bot.chat(req.body.message);
    res.redirect("/");
});

app.get("/reconnect", auth, (req, res) => {
    if (bot) bot.end(); // Use .end() instead of .quit()
    res.redirect("/");
});

app.listen(PORT, () => console.log("🚀 Panel running on port", PORT));
