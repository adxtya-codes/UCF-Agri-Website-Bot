const { loadData, loadSettings } = require('./utils');

// Store the WhatsApp client reference
let whatsappClient = null;

// Track whether tips were already sent today (Zimbabwe date) - resets on restart
let lastTipSentDate = null;

/**
 * Get the current date string in Zimbabwe time (Africa/Harare = UTC+2)
 */
function getZimbabweDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Harare' });
}

/**
 * Get the current hour and minute in Zimbabwe time
 */
function getZimbabweTime() {
  const now = new Date();
  const hour = parseInt(now.toLocaleString('en-US', { timeZone: 'Africa/Harare', hour: 'numeric', hour12: false }));
  const raw = now.toLocaleString('en-US', { timeZone: 'Africa/Harare', minute: '2-digit' });
  const minute = parseInt(raw);
  return { hour: isNaN(hour) ? 0 : hour, minute: isNaN(minute) ? 0 : minute };
}

/**
 * Parse a time string like "08:00" or "10:30" into { hour, minute }
 */
function parseTimeSetting(timeStr) {
  const parts = (timeStr || '08:00').split(':');
  return {
    hour: parseInt(parts[0]) || 8,
    minute: parseInt(parts[1]) || 0
  };
}

/**
 * Initialize daily tips system with WhatsApp client
 * @param {Object} client - WhatsApp client instance
 */
function initializeDailyTips(client) {
  whatsappClient = client;

  // Check every minute whether it's time to send tips
  setInterval(() => {
    checkAndSendTips();
  }, 60 * 1000);

  console.log('✅ Daily farming tips scheduler initialized (checks every minute, Zimbabwe time)');
}

/**
 * Check if it's time to send tips and send them if it is
 */
async function checkAndSendTips() {
  try {
    const settings = loadSettings();
    const sendTime = parseTimeSetting(settings.tips_send_time || '08:00');
    const { hour, minute } = getZimbabweTime();
    const todayZW = getZimbabweDate();

    // Fire at exact Zimbabwe time, once per day
    if (hour === sendTime.hour && minute === sendTime.minute && lastTipSentDate !== todayZW) {
      console.log(`🕐 It's ${hour}:${String(minute).padStart(2, '0')} Zimbabwe time — sending daily tips...`);
      lastTipSentDate = todayZW; // mark as sent before sending to avoid duplicates
      await sendDailyTips();
    }
  } catch (error) {
    console.error('❌ Error in tips time-check:', error);
  }
}

/**
 * Send daily farming tips to all active users.
 * Uses a ROTATING tip strategy (day-of-year index mod total tips) so tips
 * always send regardless of send_date values in tips.json.
 */
async function sendDailyTips() {
  try {
    const users = loadData('users.json');
    const tips = loadData('tips.json');

    if (tips.length === 0) {
      console.log('⚠️ No farming tips available');
      return;
    }

    const todayZW = getZimbabweDate();
    console.log(`📅 Sending daily tip for Zimbabwe date: ${todayZW}`);

    // Calculate which tip to send based on day count from a fixed start
    const startDate = new Date('2026-01-01T00:00:00+02:00');
    const todayDate = new Date(todayZW + 'T00:00:00+02:00');
    const dayIndex = Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24));
    const tipIndex = ((dayIndex % tips.length) + tips.length) % tips.length;
    const todaysTip = tips[tipIndex];

    console.log(`💡 Today's tip (#${tipIndex + 1}/${tips.length}): "${todaysTip.title}"`);

    // Active users: have a name, valid individual phone, interacted in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const activeUsers = users.filter(user => {
      if (!user.name) return false;
      if (!user.phone || !user.phone.includes('@')) return false;
      if (user.phone === 'status@broadcast') return false;
      if (user.phone.includes('@g.us')) return false; // skip group chats
      if (!user.last_interaction) return true; // new users with a name, include them
      return new Date(user.last_interaction) > ninetyDaysAgo;
    });

    console.log(`📤 Sending to ${activeUsers.length} active users (${users.length} total)`);

    if (activeUsers.length === 0) {
      console.log('⚠️ No active users to send tips to.');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const user of activeUsers) {
      try {
        const tipMessage = `🌱 *Daily Farming Tip from UCF*\n\n*${todaysTip.title}*\n${todaysTip.content}\n\n💡 *Remember:* We're here to help you grow! Type "menu" anytime to access our services.\n\n🌾 *UCF Agri-Bot - Your Farming Partner*`;
        await whatsappClient.sendMessage(user.phone, tipMessage);
        successCount++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to send tip to ${user.phone} (${user.name}):`, error.message);
      }
    }

    console.log(`🌱 Daily tips done: ✅ ${successCount} sent, ❌ ${failCount} failed`);

  } catch (error) {
    console.error('❌ Error in daily tips system:', error);
  }
}

/**
 * Send a test tip immediately (for testing)
 * @param {string} phoneNumber - Phone number to send test tip to
 */
async function sendTestTip(phoneNumber) {
  try {
    const tips = loadData('tips.json');
    if (tips.length === 0) {
      console.log('⚠️ No tips available for testing');
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
 * Get statistics about the daily tips system
 */
function getDailyTipsStats() {
  const users = loadData('users.json');
  const tips = loadData('tips.json');
  const settings = loadSettings();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const activeUsers = users.filter(user => {
    if (!user.name || !user.phone || !user.phone.includes('@')) return false;
    if (user.phone === 'status@broadcast' || user.phone.includes('@g.us')) return false;
    if (!user.last_interaction) return true;
    return new Date(user.last_interaction) > ninetyDaysAgo;
  });

  const sendTime = settings.tips_send_time || '08:00';

  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    totalTips: tips.length,
    lastScheduledTime: `${sendTime} CAT (Zimbabwe time) daily`
  };
}

module.exports = {
  initializeDailyTips,
  sendDailyTips,
  sendTestTip,
  getDailyTipsStats
};
