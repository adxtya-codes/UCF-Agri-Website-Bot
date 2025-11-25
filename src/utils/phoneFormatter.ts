/**
 * Formats a WhatsApp phone number to a clean, readable format
 * Removes WhatsApp-specific suffixes like @c.us, @lid, etc.
 * @param phone - The phone number to format (e.g., "918810202799@c.us")
 * @returns Cleaned phone number (e.g., "+91 8810202799")
 */
export function formatPhoneNumber(phone: string): string {
    if (!phone) return "";

    // Remove WhatsApp suffixes (@c.us, @lid, @s.whatsapp.net, etc.)
    let cleaned = phone.split('@')[0];

    // Remove any non-digit characters
    cleaned = cleaned.replace(/\D/g, '');

    // If the number starts with country code, format it nicely
    if (cleaned.length > 10) {
        // Extract country code (assuming 1-3 digits)
        const countryCode = cleaned.slice(0, -10);
        const number = cleaned.slice(-10);

        // Format as: +CC XXXXXXXXXX
        return `+${countryCode} ${number}`;
    }

    return cleaned;
}

/**
 * Gets the raw phone number without WhatsApp formatting
 * @param phone - The phone number to clean
 * @returns Phone number without @ suffix
 */
export function getCleanPhone(phone: string): string {
    if (!phone) return "";
    return phone.split('@')[0];
}
