const mineflayer = require("mineflayer")
const AutoAuth = require("mineflayer-auto-auth")
const express = require("express")
const session = require("express-session")
const bodyParser = require("body-parser")

const app = express()
const PORT = process.env.PORT || 3000
const PANEL_PASSWORD = "admin123" // 🔐 CHANGE THIS

let bot
let lastPing = 0
let lastTPS = 20

// EXPRESS SETUP
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: true
}))

function auth(req, res, next) {
  if (req.session.loggedIn) return next()
  res.redirect("/login")
}

function startBot() {
  bot = mineflayer.createBot({
    host: "play-LOVE.aternos.me",
    port: 50294,
    username: "BOT_XD",
    onlineMode: false,
    version: false,
    plugins: [AutoAuth],
    AutoAuth: "bot112022"
  })

  bot.once("spawn", () => {
    console.log("Bot joined server!")

    setInterval(() => {
      if (!bot?.entity) return
      bot.setControlState("jump", true)
      setTimeout(() => bot.setControlState("jump", false), 300)
    }, 30000)
  })

  bot.on("time", () => {
    lastTPS = (20 / bot.time.delta).toFixed(2)
  })

  bot.on("physicTick", () => {
    if (bot.player) lastPing = bot.player.ping
  })

  bot.on("end", () => {
    console.log("Disconnected. Reconnecting in 15s...")
    setTimeout(() => process.exit(1), 15000)
  })

  bot.on("error", e => console.log("Error:", e.message))
}

startBot()

// LOGIN PAGE
app.get("/login", (req, res) => {
  res.send(`
    <h2>🔐 Developer Login</h2>
    <form method="POST">
      <input type="password" name="password" placeholder="Password"/>
      <button type="submit">Login</button>
    </form>
  `)
})

app.post("/login", (req, res) => {
  if (req.body.password === PANEL_PASSWORD) {
    req.session.loggedIn = true
    return res.redirect("/")
  }
  res.send("Wrong password")
})

// MAIN PANEL
app.get("/", auth, (req, res) => {
  const players = bot?.players ? Object.keys(bot.players) : []
  const status = bot?.player ? "🟢 ONLINE" : "🔴 OFFLINE"

  res.send(`
    <h1>🤖 Minecraft Developer Panel</h1>
    <p>Status: ${status}</p>
    <p>Ping: ${lastPing} ms</p>
    <p>TPS: ${lastTPS}</p>
    <p>Player Count: ${players.length}</p>
    <p>Players: ${players.join(", ")}</p>

    <form method="POST" action="/chat">
      <input name="message" placeholder="Send chat message"/>
      <button type="submit">Send</button>
    </form>

    <br/>
    <a href="/reconnect"><button>Reconnect Bot</button></a>
    <a href="/restart"><button>Restart Container</button></a>
    <a href="/logout"><button>Logout</button></a>
  `)
})

// SEND CHAT
app.post("/chat", auth, (req, res) => {
  if (bot?.chat) bot.chat(req.body.message)
  res.redirect("/")
})

// RECONNECT BOT
app.get("/reconnect", auth, (req, res) => {
  if (bot) bot.quit()
  res.redirect("/")
})

// RESTART CONTAINER
app.get("/restart", auth, (req, res) => {
  res.send("Restarting...")
  process.exit(1)
})

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"))
})

app.listen(PORT, () => {
  console.log("Developer panel running on port", PORT)
})
