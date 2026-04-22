const { appConfig, getDataBundle } = require('../../utils/data')
const { getLitLocations, isLocationLit, lightLocation } = require('../../utils/storage')

function decorateMapLocations(allLocations, selectedAreaId, selectedLocationId, litLocationIds) {
    return (allLocations || []).map((item) => ({
        ...item,
        isActive: item.id === selectedLocationId,
        isInArea: item.areaId === selectedAreaId,
        isLit: litLocationIds.includes(item.id),
    }))
}

function decorateLocationTabs(allLocations, areaId, selectedLocationId, litLocationIds) {
    return (allLocations || [])
        .filter((item) => item.areaId === areaId)
        .map((item) => ({
            ...item,
            isActive: item.id === selectedLocationId,
            isLit: litLocationIds.includes(item.id),
        }))
}

function decorateRecommendedEvents(allEvents) {
    const cardTones = ['green', 'blue']
    return (allEvents || []).slice(0, 2).map((item, index) => ({
        ...item,
        cardTone: cardTones[index % cardTones.length],
        spotLine: item.highlight || item.shortDesc,
    }))
}

function buildMapHint(locationName, count) {
    if (!locationName) {
        return '点一点地图，看看哪儿有新鲜事'
    }
    if (count <= 0) {
        return `${locationName}现在比较安静，去别处看看新的奇遇吧`
    }
    if (count === 1) {
        return `${locationName}今天有 1 个奇遇，刚好慢慢逛`
    }
    return `${locationName}今天有 ${count} 个奇遇，跟着微仔去看看`
}

function buildSpotlightHint(locationName, count) {
    if (!locationName) {
        return '这里好像有热闹正在发生'
    }
    if (count <= 0) {
        return `${locationName}暂时没有安排，换个点位继续探索吧`
    }
    if (count === 1) {
        return `微仔在 ${locationName} 找到 1 个新鲜事`
    }
    return `微仔在 ${locationName} 找到 ${count} 个新鲜事`
}

function getRuntimeMode() {
    const app = getApp()
    if (app && typeof app.getCurrentMode === 'function') {
        return app.getCurrentMode()
    }
    return appConfig.mode
}

Page({
    data: {
        appConfig,
        areas: [],
        currentMode: 'special',
        topicTitle: '',
        selectedAreaId: 'center',
        selectedLocationId: 'zhongcao',
        locationTabs: [],
        mapLocations: [],
        recommendedEvents: [],
        currentArea: null,
        currentLocation: null,
        litLocationIds: [],
        isCurrentLocationLit: false,
        mapHint: '点一点地图，看看哪儿有新鲜事',
        spotlightHint: '这里好像有热闹正在发生',
        locationEventCount: 0,
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
            duration: 1200,
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

        const litLocationIds = getLitLocations()
        this.refreshVisualState(targetLocation.areaId, locationId, litLocationIds)
    },

    onLightLocation() {
        const { selectedLocationId, selectedAreaId } = this.data
        if (!selectedLocationId) {
            return
        }

        const alreadyLit = isLocationLit(selectedLocationId)
        if (!alreadyLit) {
            lightLocation(selectedLocationId)
        }

        const litLocationIds = getLitLocations()
        this.refreshVisualState(selectedAreaId, selectedLocationId, litLocationIds)

        wx.showToast({
            title: alreadyLit ? '这个点位已经点亮啦' : '点位点亮成功',
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

        this.setData({
            areas: runtimeAreas,
            currentMode: runtimeMode,
            topicTitle: bundle.topic ? bundle.topic.title : appConfig.specialTopicTitle,
        })

        this.refreshVisualState(selectedAreaId, selectedLocationId, getLitLocations())
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
        const nextLocationId = areaLocations.length > 0 ? areaLocations[0].id : ''
        this.refreshVisualState(areaId, nextLocationId, getLitLocations())
    },

    refreshVisualState(areaId, locationId, litLocationIds) {
        const runtimeAreas = this.runtimeAreas || []
        const runtimeLocations = this.runtimeLocations || []

        let nextAreaId = areaId
        if (!runtimeAreas.some((item) => item.id === nextAreaId)) {
            nextAreaId = runtimeAreas.length > 0 ? runtimeAreas[0].id : ''
        }

        const areaLocations = runtimeLocations.filter((item) => item.areaId === nextAreaId)
        let nextLocationId = locationId
        if (!areaLocations.some((item) => item.id === nextLocationId)) {
            nextLocationId = areaLocations.length > 0 ? areaLocations[0].id : ''
        }

        const currentArea = this.getAreaById(nextAreaId)
        const currentLocation = this.getLocationById(nextLocationId)
        const locationEvents = this.getEventsByLocation(nextLocationId)
        const recommendedEvents = decorateRecommendedEvents(locationEvents)
        const locationName = currentLocation ? currentLocation.name : ''

        this.setData({
            selectedAreaId: nextAreaId,
            selectedLocationId: nextLocationId,
            currentArea,
            currentLocation,
            locationTabs: decorateLocationTabs(runtimeLocations, nextAreaId, nextLocationId, litLocationIds),
            mapLocations: decorateMapLocations(runtimeLocations, nextAreaId, nextLocationId, litLocationIds),
            recommendedEvents,
            litLocationIds,
            isCurrentLocationLit: litLocationIds.includes(nextLocationId),
            locationEventCount: locationEvents.length,
            mapHint: buildMapHint(locationName, locationEvents.length),
            spotlightHint: buildSpotlightHint(locationName, locationEvents.length),
        })
    },
})
