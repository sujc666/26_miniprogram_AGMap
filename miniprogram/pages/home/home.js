const { appConfig, getDataBundle } = require('../../utils/data')
const {
    getLitEvents,
    lightEvent,
    isEventLit,
    getFavoriteEvents,
    toggleFavoriteEvent,
} = require('../../utils/storage')

function decorateMapLocations(allLocations, selectedAreaId, selectedLocationId, litIds) {
    return allLocations.map((item) => ({
        ...item,
        isActive: item.id === selectedLocationId,
        isInArea: item.areaId === selectedAreaId,
        isLit: litIds.includes(item.id),
    }))
}

function decorateLocationTabs(allLocations, areaId, selectedLocationId, litIds) {
    return allLocations.filter((item) => item.areaId === areaId).map((item) => ({
        ...item,
        isActive: item.id === selectedLocationId,
        isLit: litIds.includes(item.id),
    }))
}

function getRuntimeMode() {
    const app = getApp()
    if (app && typeof app.getCurrentMode === 'function') {
        return app.getCurrentMode()
    }
    return appConfig.mode
}

function collectLitLocationIds(allEvents, litEventIds) {
    const litSet = new Set(litEventIds)
    const locationSet = new Set()
        ; (allEvents || []).forEach((item) => {
            if (litSet.has(item.id)) {
                locationSet.add(item.locationId)
            }
        })
    return Array.from(locationSet)
}

function decorateRecommendedEvents(allEvents, litEventIds, favoriteEventIds) {
    const litSet = new Set(litEventIds)
    const favoriteSet = new Set(favoriteEventIds)
    return (allEvents || []).map((item) => ({
        ...item,
        isLit: litSet.has(item.id),
        isFavorited: favoriteSet.has(item.id),
    }))
}

Page({
    data: {
        appConfig,
        areas: [],
        currentMode: 'special',
        topicTitle: '',
        topicSubtitle: '',
        selectedAreaId: 'center',
        selectedLocationId: 'zhongcao',
        locationTabs: [],
        mapLocations: [],
        recommendedEvents: [],
        currentArea: null,
        currentLocation: null,
        litEventIds: [],
        favoriteEventIds: [],
        litLocationIds: [],
        isCurrentLocationLit: false,
        showMascotImage: true,
    },

    onLoad() {
        this.setupRuntimeData(false)
    },

    onShow() {
        this.setupRuntimeData(true)
    },

    onMascotImageError() {
        this.setData({ showMascotImage: false })
    },

    onToggleMode() {
        const app = getApp()
        const currentMode = app && typeof app.getCurrentMode === 'function' ? app.getCurrentMode() : this.data.currentMode
        const nextMode = currentMode === 'special' ? 'general' : 'special'
        const appliedMode = app && typeof app.setCurrentMode === 'function' ? app.setCurrentMode(nextMode) : nextMode

        this.setupRuntimeData(true)
        wx.showToast({
            title: appliedMode === 'special' ? '切回专题版啦' : '已切到通用版骨架',
            icon: 'none',
            duration: 1300,
        })
    },

    onAreaTap(e) {
        const { areaId } = e.currentTarget.dataset
        if (!areaId || areaId === this.data.selectedAreaId) {
            return
        }
        this.syncByArea(areaId)
    },

    onLocationTap(e) {
        const { locationId } = e.currentTarget.dataset
        if (!locationId) {
            return
        }
        const targetLocation = this.getLocationById(locationId)
        if (!targetLocation) {
            return
        }

        const areaId = targetLocation.areaId
        const litEventIds = getLitEvents()
        const favoriteEventIds = getFavoriteEvents()
        const litLocationIds = collectLitLocationIds(this.runtimeEvents || [], litEventIds)
        this.setData({
            selectedAreaId: areaId,
            selectedLocationId: locationId,
            litEventIds,
            favoriteEventIds,
            litLocationIds,
        })
        this.refreshVisualState(areaId, locationId, litEventIds, favoriteEventIds)
    },

    onLightEvent(e) {
        const { eventId } = e.currentTarget.dataset
        if (!eventId) {
            return
        }

        const alreadyLit = isEventLit(eventId)
        if (!alreadyLit) {
            lightEvent(eventId)
        }

        const litEventIds = getLitEvents()
        const favoriteEventIds = getFavoriteEvents()
        this.setData({ litEventIds })
        this.refreshVisualState(this.data.selectedAreaId, this.data.selectedLocationId, litEventIds, favoriteEventIds)

        wx.showToast({
            title: alreadyLit ? '这个奇遇已经点亮啦' : '奇遇点亮成功',
            icon: 'none',
            duration: 1400,
        })
    },

    onToggleFavoriteEvent(e) {
        const { eventId } = e.currentTarget.dataset
        if (!eventId) {
            return
        }

        const nextFavorites = toggleFavoriteEvent(eventId)
        const isFavorited = nextFavorites.includes(eventId)
        const litEventIds = getLitEvents()

        this.setData({
            favoriteEventIds: nextFavorites,
            litEventIds,
        })
        this.refreshVisualState(this.data.selectedAreaId, this.data.selectedLocationId, litEventIds, nextFavorites)

        wx.showToast({
            title: isFavorited ? '已收藏，下次就去' : '已取消收藏',
            icon: 'none',
            duration: 1200,
        })
    },

    onGoDiscover() {
        wx.switchTab({
            url: '/pages/discover/discover',
        })
    },

    onOpenDetail(e) {
        const { eventId } = e.currentTarget.dataset
        if (!eventId) {
            return
        }
        wx.navigateTo({
            url: `/pages/detail/detail?id=${eventId}&mode=${this.data.currentMode}`,
        })
    },

    setupRuntimeData(keepSelection) {
        const runtimeMode = getRuntimeMode()
        const bundle = getDataBundle(runtimeMode)
        const runtimeAreas = bundle.areas || []
        const runtimeLocations = bundle.locations || []
        const runtimeEvents = bundle.events || []

        this.runtimeAreas = runtimeAreas
        this.runtimeLocations = runtimeLocations
        this.runtimeEvents = runtimeEvents

        const fallbackAreaId = runtimeAreas.length > 0 ? runtimeAreas[0].id : ''
        let selectedAreaId = keepSelection ? this.data.selectedAreaId : fallbackAreaId
        if (!runtimeAreas.some((item) => item.id === selectedAreaId)) {
            selectedAreaId = fallbackAreaId
        }

        const areaLocations = runtimeLocations.filter((item) => item.areaId === selectedAreaId)
        const fallbackLocationId = areaLocations.length > 0 ? areaLocations[0].id : ''
        let selectedLocationId = keepSelection ? this.data.selectedLocationId : fallbackLocationId
        if (!areaLocations.some((item) => item.id === selectedLocationId)) {
            selectedLocationId = fallbackLocationId
        }

        const litEventIds = getLitEvents()
        const favoriteEventIds = getFavoriteEvents()
        const litLocationIds = collectLitLocationIds(runtimeEvents, litEventIds)
        this.setData({
            areas: runtimeAreas,
            currentMode: runtimeMode,
            topicTitle: bundle.topic ? bundle.topic.title : appConfig.specialTopicTitle,
            topicSubtitle: bundle.topic ? bundle.topic.subtitle : appConfig.specialTopicSubtitle,
            selectedAreaId,
            selectedLocationId,
            litEventIds,
            favoriteEventIds,
            litLocationIds,
        })

        this.refreshVisualState(selectedAreaId, selectedLocationId, litEventIds, favoriteEventIds)
    },

    getAreaById(areaId) {
        return (this.runtimeAreas || []).find((item) => item.id === areaId) || null
    },

    getLocationById(locationId) {
        return (this.runtimeLocations || []).find((item) => item.id === locationId) || null
    },

    getLocationsByArea(areaId) {
        return (this.runtimeLocations || []).filter((item) => item.areaId === areaId)
    },

    getEventsByLocation(locationId) {
        return (this.runtimeEvents || []).filter((item) => item.locationId === locationId)
    },

    syncByArea(areaId) {
        const areaLocations = this.getLocationsByArea(areaId)
        const nextLocation = areaLocations.length > 0 ? areaLocations[0].id : ''
        const litEventIds = getLitEvents()
        const favoriteEventIds = getFavoriteEvents()
        const litLocationIds = collectLitLocationIds(this.runtimeEvents || [], litEventIds)

        this.setData({
            selectedAreaId: areaId,
            selectedLocationId: nextLocation,
            litEventIds,
            favoriteEventIds,
            litLocationIds,
        })

        this.refreshVisualState(areaId, nextLocation, litEventIds, favoriteEventIds)
    },

    refreshVisualState(areaId, locationId, litEventIds, favoriteEventIds) {
        const currentArea = this.getAreaById(areaId)
        const currentLocation = this.getLocationById(locationId)
        const recommendedEventsRaw = this.getEventsByLocation(locationId)
        const runtimeFavorites = favoriteEventIds || this.data.favoriteEventIds || getFavoriteEvents()
        const recommendedEvents = decorateRecommendedEvents(recommendedEventsRaw, litEventIds, runtimeFavorites)
        const litLocationIds = collectLitLocationIds(this.runtimeEvents || [], litEventIds)

        this.setData({
            currentArea,
            currentLocation,
            locationTabs: decorateLocationTabs(this.runtimeLocations || [], areaId, locationId, litLocationIds),
            mapLocations: decorateMapLocations(this.runtimeLocations || [], areaId, locationId, litLocationIds),
            recommendedEvents,
            litLocationIds,
            isCurrentLocationLit: litLocationIds.includes(locationId),
        })
    },
})
