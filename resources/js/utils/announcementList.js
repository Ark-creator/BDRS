export const normalizeAnnouncements = (items = [], limit = null) => {
    const seen = new Set();

    const normalized = items.filter((announcement) => {
        if (!announcement?.id || seen.has(announcement.id)) {
            return false;
        }

        seen.add(announcement.id);
        return true;
    });

    return limit > 0 ? normalized.slice(0, limit) : normalized;
};

export const prependAnnouncement = (items = [], announcement, limit = null) => normalizeAnnouncements([
    announcement,
    ...items.filter((item) => item.id !== announcement?.id),
], limit);

export const updateAnnouncement = (items = [], announcement) => items.map((item) => (
    item.id === announcement?.id ? announcement : item
));

export const removeAnnouncement = (items = [], announcementId) => items.filter((item) => (
    item.id !== announcementId
));
