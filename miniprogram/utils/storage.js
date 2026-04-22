const STORAGE_KEYS = {
    LIT_LOCATIONS: 'weizai_lit_locations',
    LIT_EVENTS: 'weizai_lit_events',
    FAVORITE_EVENTS: 'weizai_favorite_events',
}

function readArray(key) {
    const value = wx.getStorageSync(key)
    return Array.isArray(value) ? value : []
}

function writeArray(key, list) {
    const cleanList = Array.from(new Set((list || []).filter(Boolean)))
    wx.setStorageSync(key, cleanList)
    return cleanList
}

function getLitLocations() {
    return readArray(STORAGE_KEYS.LIT_LOCATIONS)
}

function isLocationLit(locationId) {
    return getLitLocations().includes(locationId)
}

function lightLocation(locationId) {
    const current = getLitLocations()
    if (current.includes(locationId)) {
        return current
    }
    return writeArray(STORAGE_KEYS.LIT_LOCATIONS, current.concat(locationId))
}

function clearLitLocations() {
    wx.removeStorageSync(STORAGE_KEYS.LIT_LOCATIONS)
}

function getLitEvents() {
    return readArray(STORAGE_KEYS.LIT_EVENTS)
}

function isEventLit(eventId) {
    return getLitEvents().includes(eventId)
}

function lightEvent(eventId) {
    const current = getLitEvents()
    if (current.includes(eventId)) {
        return current
    }
    return writeArray(STORAGE_KEYS.LIT_EVENTS, current.concat(eventId))
}

function clearLitEvents() {
    wx.removeStorageSync(STORAGE_KEYS.LIT_EVENTS)
}

function getFavoriteEvents() {
    return readArray(STORAGE_KEYS.FAVORITE_EVENTS)
}

function isEventFavorited(eventId) {
    return getFavoriteEvents().includes(eventId)
}

function toggleFavoriteEvent(eventId) {
    const current = getFavoriteEvents()
    const next = current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : current.concat(eventId)
    return writeArray(STORAGE_KEYS.FAVORITE_EVENTS, next)
}

function clearFavoriteEvents() {
    wx.removeStorageSync(STORAGE_KEYS.FAVORITE_EVENTS)
}

function clearAllLocalRecords() {
    // 新版点亮逻辑使用奇遇事件，旧版点位键一并清理避免脏状态。
    clearLitEvents()
    clearLitLocations()
    clearFavoriteEvents()
}

function getTitleByLitCount(count) {
    if (count <= 0) {
        return '刚出发的小芽芽'
    }
    if (count <= 2) {
        return '初来乍到的微仔同伴'
    }
    if (count <= 5) {
        return '校园奇遇探索者'
    }
    return '社团漫游达人'
}

module.exports = {
    STORAGE_KEYS,
    getLitLocations,
    isLocationLit,
    lightLocation,
    clearLitLocations,
    getLitEvents,
    isEventLit,
    lightEvent,
    clearLitEvents,
    getFavoriteEvents,
    isEventFavorited,
    toggleFavoriteEvent,
    clearFavoriteEvents,
    clearAllLocalRecords,
    getTitleByLitCount,
}
