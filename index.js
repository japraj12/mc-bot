const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const AutoAuth = require('mineflayer-auto-auth')

function createBot() {

const bot = mineflayer.createBot({
  host: 'play-LOVE.aternos.me',
  port: 50294,
  username: 'BOT_XD',
  version: false,
  onlineMode: false, // IMPORTANT FOR CRACKED
  plugins: [AutoAuth],
  AutoAuth: 'bot112022'
})

bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
bot.loadPlugin(pathfinder)

console.log("Bot starting...")

// ✅ Anti-AFK (jump every 30s)
bot.on('spawn', () => {
  console.log("Bot joined server!")

  setInterval(() => {
    bot.setControlState("jump", true)
    setTimeout(() => bot.setControlState("jump", false), 300)
  }, 30000)
})

// Auto equip sword
bot.on('playerCollect', (collector) => {
  if (collector !== bot.entity) return
  setTimeout(() => {
    const sword = bot.inventory.items().find(i => i.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 150)
})

// Auto equip shield
bot.on('playerCollect', (collector) => {
  if (collector !== bot.entity) return
  setTimeout(() => {
    const shield = bot.inventory.items().find(i => i.name.includes('shield'))
    if (shield) bot.equip(shield, 'off-hand')
  }, 250)
})

// Guard system
let guardPos = null

function guardArea(pos) {
  guardPos = pos.clone()
  moveToGuardPos()
}

function moveToGuardPos() {
  const mcData = require('minecraft-data')(bot.version)
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}

function stopGuarding() {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}

bot.on('chat', (username, message) => {
  if (message === 'guard') {
    const player = bot.players[username]
    if (player && player.entity) {
      bot.chat('Guarding!')
      guardArea(player.entity.position)
    }
  }

  if (message === 'stop') {
    bot.chat('Stopping!')
    stopGuarding()
  }
})

// Attack nearby mobs
bot.on('physicTick', () => {
  if (!guardPos) return
  const entity = bot.nearestEntity(e =>
    e.type === 'mob' &&
    e.position.distanceTo(bot.entity.position) < 16
  )
  if (entity) bot.pvp.attack(entity)
})

// ✅ STRONG Auto-Reconnect (for Railway)
bot.on('end', () => {
  console.log("Disconnected. Restarting...")
  setTimeout(() => process.exit(1), 5000)
})

bot.on('kicked', reason => console.log("Kicked:", reason))
bot.on('error', err => console.log("Error:", err))

}

createBot()
