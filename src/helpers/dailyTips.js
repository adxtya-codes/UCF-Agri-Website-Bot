const { loadData, loadSettings } = require('./utils');

// Store the WhatsApp client reference
let whatsappClient = null;

// Track whether tips were already sent today (Zimbabwe date) - resets on restart
let lastTipSentDate = null;

/**
 * Get the current time in Zimbabwe time as "HH:MM" string (24-hour format)
 * Zimbabwe = Africa/Harare = UTC+2
 */
function getZimbabweTimeStr() {
  const now = new Date();
  // UTC offset for Zimbabwe is +2 hours
  const zwOffset = 2 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const zwTotalMinutes = (utcMinutes + zwOffset + 1440) % 1440;
  const zwHour = Math.floor(zwTotalMinutes / 60);
  const zwMinute = zwTotalMinutes % 60;
  return `${String(zwHour).padStart(2, '0')}:${String(zwMinute).padStart(2, '0')}`;
}

/**
 * Get the current date string in Zimbabwe time (YYYY-MM-DD)
 */
function getZimbabweDateStr() {
  const now = new Date();
  const zwOffset = 2 * 60 * 60 * 1000; // +2 hours in ms
  const zwDate = new Date(now.getTime() + zwOffset);
  return zwDate.toISOString().slice(0, 10);
}

/**
 * Normalize settings time to "HH:MM" format (e.g. "8:00" → "08:00")
 */
function normalizeTime(timeStr) {
  const parts = (timeStr || '08:00').split(':');
  const h = String(parseInt(parts[0]) || 0).padStart(2, '0');
  const m = String(parseInt(parts[1]) || 0).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Initialize daily tips system with WhatsApp client
 * @param {Object} client - WhatsApp client instance
 */
function initializeDailyTips(client) {
  whatsappClient = client;

  // Check every minute whether it's time to send tips
  setInterval(() => {
    checkAndSendTips().catch(err => console.error('❌ Tips check error:', err));
  }, 60 * 1000);

  console.log('✅ Daily farming tips scheduler initialized (checks every minute, Zimbabwe time)');
  console.log(`🕐 Current Zimbabwe time: ${getZimbabweTimeStr()} | Date: ${getZimbabweDateStr()}`);
}

/**
 * Check if it's time to send tips and send them if it is
 */
async function checkAndSendTips() {
  const settings = loadSettings();
  const scheduledTime = normalizeTime(settings.tips_send_time || '08:00');
  const currentTime = getZimbabweTimeStr();
  const todayZW = getZimbabweDateStr();

  console.log(`💡 Tips check: ZW time=${currentTime}, scheduled=${scheduledTime}, lastSent=${lastTipSentDate}`);

  // Fire at exact Zimbabwe time (HH:MM match), only once per day
  if (currentTime === scheduledTime && lastTipSentDate !== todayZW) {
    console.log(`🕐 Time matched! Sending daily tips (${scheduledTime} Zimbabwe time)...`);
    lastTipSentDate = todayZW; // mark as sent before sending to avoid duplicates
    await sendDailyTips();
  }
}

/**
 * Send daily farming tips to all active users.
 * Uses a rotating tip strategy (day index mod total tips count) so tips
 * always send every day regardless of send_date values in tips.json.
 */
async function sendDailyTips() {
  try {
    const users = loadData('users.json');
    const tips = loadData('tips.json');

    if (tips.length === 0) {
      console.log('⚠️ No farming tips available');
      return;
    }

    const todayZW = getZimbabweDateStr();
    console.log(`📅 Sending daily tip for Zimbabwe date: ${todayZW}`);

    // Rotating tip: days since fixed start date, cycling through all tips
    const startDate = new Date('2026-01-01T00:00:00Z');
    const todayDate = new Date(todayZW + 'T00:00:00Z');
    const dayIndex = Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24));
    const tipIndex = ((dayIndex % tips.length) + tips.length) % tips.length;
    const todaysTip = tips[tipIndex];

    console.log(`💡 Today's tip (#${tipIndex + 1}/${tips.length}): "${todaysTip.title}"`);

    // Filter valid, individual, active users
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const activeUsers = users.filter(user => {
      if (!user.name) return false;
      if (!user.phone || !user.phone.includes('@')) return false;
      if (user.phone === 'status@broadcast') return false;
      if (user.phone.includes('@g.us')) return false; // skip group chats
      if (user.phone.includes('@newsletter')) return false;
      if (!user.last_interaction) return true;
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

  const sendTime = normalizeTime(settings.tips_send_time || '08:00');

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
