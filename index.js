const mineflayer = require("mineflayer")
const AutoAuth = require("mineflayer-auto-auth")

let reconnecting = false

function startBot () {
  reconnecting = false

  console.log("Bot starting...")

  const bot = mineflayer.createBot({
    host: "play-LOVE.aternos.me",
    port: 50294,
    username: "BOT_XD",
    version: false,          // auto-detect
    onlineMode: false,       // REQUIRED for cracked
    plugins: [AutoAuth],
    AutoAuth: "bot112022"    // cracked login password
  })

  // ✅ SUCCESSFUL JOIN
  bot.once("spawn", () => {
    console.log("Bot fully joined server!")

    // Anti-AFK (small jump every 30s)
    setInterval(() => {
      bot.setControlState("jump", true)
      setTimeout(() => bot.setControlState("jump", false), 300)
    }, 30000)
  })

  // ✅ AUTO LOGIN (backup safety)
  bot.on("chat", (username, message) => {
    if (message.toLowerCase().includes("register")) {
      bot.chat("/register bot112022 bot112022")
    }
    if (message.toLowerCase().includes("login")) {
      bot.chat("/login bot112022")
    }
  })

  // ✅ CLEAN DISCONNECT HANDLING
  bot.on("end", () => {
    if (reconnecting) return
    reconnecting = true

    console.log("Disconnected. Reconnecting in 15 seconds...")
    setTimeout(() => {
      process.exit(1) // Railway restarts it
    }, 15000)
  })

  // LOG ONLY (no crash)
  bot.on("kicked", reason => {
    console.log("Kicked:", reason)
  })

  bot.on("error", err => {
    console.log("Error:", err.message)
  })
}

startBot()
