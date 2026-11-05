const DAY_KEYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
];

const DEFAULT_WORKING_HOURS = DAY_KEYS.map(day => ({
    day,
    enabled: true,
    start: "09:00",
    end: "18:00"
}));

function getAvailableWorkingTimes(date, settings) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return [];

    const [year, month, day] = date.split("-").map(Number);
    const selectedDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const dayKey = DAY_KEYS[selectedDay];

    const workingHours = Array.isArray(settings?.workingHours) && settings.workingHours.length
        ? settings.workingHours
        : DEFAULT_WORKING_HOURS;

    const daySettings = workingHours.find(item => item.day === dayKey);
    if (!daySettings || !daySettings.enabled) return [];

    const toMinutes = value => {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""))) return null;
        const [hours, minutes] = value.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const start = toMinutes(daySettings.start);
    const end = toMinutes(daySettings.end);
    const interval = [30, 60, 90].includes(Number(settings?.appointmentInterval))
        ? Number(settings.appointmentInterval)
        : 60;

    if (start === null || end === null || end < start) return [];

    const times = [];
    for (let current = start; current <= end; current += interval) {
        const hours = String(Math.floor(current / 60)).padStart(2, "0");
        const minutes = String(current % 60).padStart(2, "0");
        times.push(`${hours}:${minutes}`);
    }

    return times;
}

module.exports = {
    getAvailableWorkingTimes,
    DEFAULT_WORKING_HOURS
};
