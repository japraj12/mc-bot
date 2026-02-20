const mineflayer = require("mineflayer")
const AutoAuth = require("mineflayer-auto-auth")
const express = require("express")

const app = express()
const PORT = process.env.PORT || 3000

let bot
let reconnecting = false

function startBot() {
  reconnecting = false

  console.log("Bot starting...")

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
      if (!bot || !bot.entity) return
      bot.setControlState("jump", true)
      setTimeout(() => bot.setControlState("jump", false), 300)
    }, 30000)
  })

  bot.on("end", () => {
    if (reconnecting) return
    reconnecting = true

    console.log("Disconnected. Reconnecting in 15s...")
    setTimeout(() => {
      process.exit(1)
    }, 15000)
  })

  bot.on("kicked", r => console.log("Kicked:", r))
  bot.on("error", e => console.log("Error:", e.message))
}

startBot()

// 🌐 WEB CONTROL PANEL
app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 Minecraft Bot Control</h1>
    <p>Status: ${bot && bot.player ? "ONLINE" : "OFFLINE"}</p>
    <button onclick="location.href='/restart'">Restart Bot</button>
    <button onclick="location.href='/reconnect'">Force Reconnect</button>
  `)
})

app.get("/restart", (req, res) => {
  res.send("Restarting bot...")
  process.exit(1)
})

app.get("/reconnect", (req, res) => {
  if (bot) bot.quit()
  res.send("Reconnecting...")
})

app.listen(PORT, () => {
  console.log("Web panel running on port", PORT)
})
