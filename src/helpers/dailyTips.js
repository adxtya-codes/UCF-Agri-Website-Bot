const { loadData, loadSettings } = require('./utils');

// Store the WhatsApp client reference
let whatsappClient = null;

// Track which tip IDs have already been sent today (keyed by ZW date string)
// Prevents double-sends if the bot restarts mid-day within the same minute
const sentTipsLog = new Map();

/**
 * Get the current time in Zimbabwe time as "HH:MM" string (24h, UTC+2)
 */
function getZimbabweTimeStr() {
  const now = new Date();
  const zwOffset = 2 * 60; // Zimbabwe is UTC+2, in minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const zwTotalMinutes = (utcMinutes + zwOffset + 1440) % 1440;
  const zwHour = Math.floor(zwTotalMinutes / 60);
  const zwMinute = zwTotalMinutes % 60;
  return `${String(zwHour).padStart(2, '0')}:${String(zwMinute).padStart(2, '0')}`;
}

/**
 * Get the current date in Zimbabwe time as "YYYY-MM-DD" string (UTC+2)
 */
function getZimbabweDateStr() {
  const now = new Date();
  const zwOffset = 2 * 60 * 60 * 1000; // +2 hours in ms
  const zwDate = new Date(now.getTime() + zwOffset);
  return zwDate.toISOString().slice(0, 10);
}

/**
 * Normalize a time string to "HH:MM" (e.g. "8:0" → "08:00")
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

  console.log('✅ Daily farming tips scheduler initialized (per-tip timing, Zimbabwe UTC+2)');
  console.log(`🕐 Current Zimbabwe time: ${getZimbabweTimeStr()} | Date: ${getZimbabweDateStr()}`);
}

/**
 * Check every minute if any tips are due right now (per-tip Zimbabwe time).
 * Each tip fires at its own send_time on its send_date.
 * Falls back to settings.tips_send_time if a tip has no send_time.
 */
async function checkAndSendTips() {
  const settings = loadSettings();
  const globalFallbackTime = normalizeTime(settings.tips_send_time || '08:00');
  const currentTime = getZimbabweTimeStr();
  const todayZW = getZimbabweDateStr();

  // Only log every 5 minutes to keep logs clean
  const currentMinute = parseInt(currentTime.split(':')[1]);
  if (currentMinute % 5 === 0) {
    console.log(`💡 Tips check: ZW time=${currentTime}, date=${todayZW}, fallback=${globalFallbackTime}`);
  }

  const tips = loadData('tips.json');
  if (tips.length === 0) return;

  // Ensure today's sent-log Set exists; prune old dates
  if (!sentTipsLog.has(todayZW)) {
    sentTipsLog.set(todayZW, new Set());
    for (const [date] of sentTipsLog) {
      if (date < todayZW) sentTipsLog.delete(date);
    }
  }
  const todaySent = sentTipsLog.get(todayZW);

  // Filter tips due right now at the current Zimbabwe minute
  const dueTips = tips.filter(tip => {
    if (tip.send_date !== todayZW) return false;          // wrong date
    if (todaySent.has(tip.id)) return false;              // already dispatched today
    const tipTime = normalizeTime(tip.send_time || globalFallbackTime);
    return currentTime === tipTime;                        // Zimbabwe time match
  });

  if (dueTips.length === 0) return;

  console.log(`🕐 ${dueTips.length} tip(s) due at ${currentTime} ZW: ${dueTips.map(t => t.title).join(', ')}`);

  for (const tip of dueTips) {
    todaySent.add(tip.id); // mark BEFORE awaiting to prevent re-entry
    await sendTipToAllUsers(tip);
  }
}

/**
 * Send a single tip to all active users.
 * @param {object} tip - Tip object from tips.json
 */
async function sendTipToAllUsers(tip) {
  try {
    const users = loadData('users.json');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const activeUsers = users.filter(user => {
      if (!user.name) return false;
      if (!user.phone || !user.phone.includes('@')) return false;
      if (user.phone === 'status@broadcast') return false;
      if (user.phone.includes('@g.us')) return false;
      if (user.phone.includes('@newsletter')) return false;
      if (!user.last_interaction) return true;
      return new Date(user.last_interaction) > ninetyDaysAgo;
    });

    console.log(`📤 Sending tip "${tip.title}" to ${activeUsers.length} active users`);

    if (activeUsers.length === 0) {
      console.log('⚠️ No active users to send tips to.');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const user of activeUsers) {
      try {
        const tipMessage = `🌱 *Daily Farming Tip from UCF*\n\n*${tip.title}*\n${tip.content}\n\n💡 *Remember:* We're here to help you grow! Type "menu" anytime to access our services.\n\n🌾 *UCF Agri-Bot - Your Farming Partner*`;
        await whatsappClient.sendMessage(user.phone, tipMessage);
        await new Promise(resolve => setTimeout(resolve, 1500));
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to send tip to ${user.phone} (${user.name}):`, error.message);
      }
    }

    console.log(`🌱 Tip "${tip.title}" done: ✅ ${successCount} sent, ❌ ${failCount} failed`);
  } catch (error) {
    console.error('❌ Error sending tip to users:', error);
  }
}

/**
 * Legacy alias — kept so any existing callers don't break.
 * Sends ALL tips scheduled for today regardless of their individual send_time.
 */
async function sendDailyTips() {
  const todayZW = getZimbabweDateStr();
  const tips = loadData('tips.json');
  const todaysTips = tips.filter(t => t.send_date === todayZW);
  console.log(`📅 sendDailyTips: ${todaysTips.length} tip(s) for ${todayZW}`);
  for (const tip of todaysTips) {
    await sendTipToAllUsers(tip);
  }
}

/**
 * Send a test tip immediately (random tip, for testing)
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
 * Send a specific (targeted) tip to a specific phone number.
 * @param {string} phoneNumber - Recipient phone number (WhatsApp ID, e.g. "2637xxx@c.us")
 * @param {string|number} tipIdentifier - Tip ID (e.g. "tip_003") OR 1-based index number
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendTargetedTip(phoneNumber, tipIdentifier) {
  try {
    const tips = loadData('tips.json');
    if (tips.length === 0) {
      return { success: false, message: '⚠️ No tips available.' };
    }

    let tip = null;

    // Try by numeric index (1-based)
    const idx = parseInt(tipIdentifier, 10);
    if (!isNaN(idx) && idx >= 1 && idx <= tips.length) {
      tip = tips[idx - 1];
    } else {
      // Try by tip ID string (e.g. "tip_003")
      tip = tips.find(t => t.id === tipIdentifier);
    }

    if (!tip) {
      return {
        success: false,
        message: `❌ Tip not found: "${tipIdentifier}". Use a valid tip number (1-${tips.length}) or ID (e.g. tip_001).`
      };
    }

    const msgText = `🌱 *Daily Farming Tip from UCF*\n\n*${tip.title}*\n${tip.content}\n\n💡 *Remember:* We're here to help you grow! Type "menu" anytime to access our services.\n\n🌾 *UCF Agri-Bot - Your Farming Partner*`;
    await whatsappClient.sendMessage(phoneNumber, msgText);
    console.log(`✅ Targeted tip "${tip.title}" sent to ${phoneNumber}`);
    return { success: true, message: `✅ Tip *${tip.title}* sent to ${phoneNumber}` };
  } catch (error) {
    console.error(`❌ Failed to send targeted tip to ${phoneNumber}:`, error);
    return { success: false, message: `❌ Failed to send tip: ${error.message}` };
  }
}

/**
 * Return a formatted list of all available tips (id, index, title).
 */
function listAllTips() {
  const tips = loadData('tips.json');
  if (tips.length === 0) return '⚠️ No tips available.';
  const lines = tips.map((t, i) => `${i + 1}. [${t.id}] *${t.title}*`);
  return `📋 *Available Tips (${tips.length}):*\n\n${lines.join('\n')}`;
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
  sendTargetedTip,
  listAllTips,
  getDailyTipsStats
};
