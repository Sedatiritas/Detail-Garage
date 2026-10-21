const APPOINTMENT_COOLDOWN_MS = 5 * 60 * 1000;
const appointmentCooldowns = new Map();

function getClientIp(req) {
    return req.ip || req.socket.remoteAddress || "unknown";
}

function cleanupAppointmentCooldowns() {
    const now = Date.now();
    for (const [ip, expiresAt] of appointmentCooldowns) {
        if (now >= expiresAt) appointmentCooldowns.delete(ip);
    }
}

function getRemainingCooldown(req) {
    cleanupAppointmentCooldowns();
    const expiresAt = appointmentCooldowns.get(getClientIp(req));
    return expiresAt ? Math.max(0, expiresAt - Date.now()) : 0;
}

function startCooldown(req) {
    appointmentCooldowns.set(
        getClientIp(req),
        Date.now() + APPOINTMENT_COOLDOWN_MS
    );
}

module.exports = { getRemainingCooldown, startCooldown };
