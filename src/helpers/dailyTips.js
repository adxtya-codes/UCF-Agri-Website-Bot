const cron = require('node-cron');
const { getUser, updateUser, loadData } = require('./utils');

// Store the WhatsApp client reference
let whatsappClient = null;

/**
 * Initialize daily tips system with WhatsApp client
 * @param {Object} client - WhatsApp client instance
 */
function initializeDailyTips(client) {
  whatsappClient = client;

  // Schedule daily tips to be sent at 10:00 AM Zimbabwe Time every day
  cron.schedule('0 10 * * *', () => {
    console.log('🌱 Sending daily farming tips...');
    sendDailyTips();
  }, {
    timezone: "Africa/Harare"
  });

  console.log('✅ Daily farming tips scheduler initialized');
}

/**
 * Send daily farming tips to all users who have interacted with the bot
 */
async function sendDailyTips() {
  try {
    const users = loadData('users.json');
    const tips = loadData('tips.json');

    if (tips.length === 0) {
      console.log('⚠️ No farming tips available');
      return;
    }

    // Get today's date in Zimbabwe time (YYYY-MM-DD)
    const now = new Date();
    const today = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Harare' });
    console.log(`📅 Checking for tips scheduled for: ${today} (Server time: ${now.toISOString()})`);

    // Filter tips scheduled for today
    const todaysTips = tips.filter(tip => tip.send_date === today);

    if (todaysTips.length === 0) {
      console.log('ℹ️ No tips scheduled for today.');

      // Log available tip dates for debugging
      const availableDates = tips.map(t => t.send_date).filter((v, i, a) => a.indexOf(v) === i);
      console.log('📅 Available tip dates:', availableDates.join(', '));
      return;
    }

    console.log(`✅ Found ${todaysTips.length} tips for today:`, todaysTips.map(t => t.title).join(', '));

    // Filter users who have interacted in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = users.filter(user => {
      // Check if user has name and valid interaction date
      if (!user.name) return false;

      if (!user.last_interaction) {
        // If no last interaction recorded, treat as active if they have a name (new user)
        return true;
      }

      const lastInteraction = new Date(user.last_interaction);
      return lastInteraction > thirtyDaysAgo;
    });

    console.log(`📤 Preparing to send to ${activeUsers.length} active users (out of ${users.length} total)`);

    if (activeUsers.length === 0) {
      console.log('⚠️ No active users found to send tips to.');
      return;
    }

    for (const user of activeUsers) {
      try {
        const chatId = user.phone;

        // Skip if chatId is invalid
        if (!chatId || !chatId.includes('@')) {
          console.log(`⚠️ Skipping invalid user phone: ${user.name}`);
          continue;
        }

        for (const tip of todaysTips) {
          const message = `🌱 *Daily Farming Tip from UCF*\n\n*${tip.title}*\n${tip.content}\n\n💡 *Remember:* We're here to help you grow! Type "menu" anytime to access our services.\n\n🌾 *UCF Agri-Bot - Your Farming Partner*`;

          await whatsappClient.sendMessage(chatId, message);
          // Add a small delay between messages
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`✅ Daily tip(s) sent to ${user.name} (${user.phone})`);

      } catch (error) {
        console.error(`❌ Failed to send tip to ${user.phone}:`, error.message);
      }
    }

    console.log('🌱 Daily farming tips delivery completed');

  } catch (error) {
    console.error('❌ Error in daily tips system:', error);
  }
}

/**
 * Send a test tip immediately (for testing purposes)
 * @param {string} phoneNumber - Phone number to send test tip to
 */
async function sendTestTip(phoneNumber) {
  try {
    const tips = loadData('tips.json');
    if (tips.length === 0) {
      console.log('⚠️ No farming tips available for testing');
      return;
    }

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    const message = `🧪 *Test Daily Farming Tip*\n\n*${randomTip.title}*\n${randomTip.content}\n\n💡 This is a test message from the daily tips system.\n\n🌾 *UCF Agri-Bot*`;

    await whatsappClient.sendMessage(phoneNumber, message);
    console.log(`✅ Test tip sent to ${phoneNumber}`);

  } catch (error) {
    console.error(`❌ Failed to send test tip to ${phoneNumber}:`, error);
  }
}

/**
 * Get statistics about daily tips system
 */
function getDailyTipsStats() {
  const users = loadData('users.json');
  const tips = loadData('tips.json');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeUsers = users.filter(user => {
    const lastInteraction = new Date(user.last_interaction);
    return lastInteraction > thirtyDaysAgo && user.name;
  });

  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    totalTips: tips.length,
    lastScheduledTime: '10:00 AM CAT daily'
  };
}

module.exports = {
  initializeDailyTips,
  sendDailyTips,
  sendTestTip,
  getDailyTipsStats
};
