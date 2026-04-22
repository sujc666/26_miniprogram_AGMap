const {
    appConfig,
    getDataBundle,
    getLocationByIdAcrossModes,
    getEventByIdAcrossModes,
} = require('../../utils/data')
const {
    getLitLocations,
    getFavoriteEvents,
    clearAllLocalRecords,
    getTitleByLitCount,
} = require('../../utils/storage')

Page({
    data: {
        appConfig,
        currentMode: 'special',
        modeLabel: '专题版',
        showMascotImage: true,
        litCount: 0,
        favoriteCount: 0,
        litLocations: [],
        favoriteEvents: [],
        titleName: '刚出发的小芽芽',
    },

    onShow() {
        this.refreshProfileData()
    },

    onPullDownRefresh() {
        this.refreshProfileData()
        wx.stopPullDownRefresh()
    },

    onMascotImageError() {
        this.setData({ showMascotImage: false })
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

    onToggleMode() {
        const app = getApp()
        const currentMode = app && typeof app.getCurrentMode === 'function' ? app.getCurrentMode() : this.data.currentMode
        const nextMode = currentMode === 'special' ? 'general' : 'special'
        const appliedMode = app && typeof app.setCurrentMode === 'function' ? app.setCurrentMode(nextMode) : nextMode

        this.refreshProfileData(appliedMode)
        wx.showToast({
            title: appliedMode === 'special' ? '已切换到专题版' : '已切换到通用版骨架',
            icon: 'none',
            duration: 1300,
        })
    },

    onGoDiscover() {
        wx.switchTab({
            url: '/pages/discover/discover',
        })
    },

    onGoHome() {
        wx.switchTab({
            url: '/pages/home/home',
        })
    },

    onClearRecords() {
        wx.showModal({
            title: '清空本地记录',
            content: '确定要清空点亮与收藏记录吗？清空后不可恢复。',
            confirmText: '清空',
            cancelText: '再想想',
            success: (res) => {
                if (!res.confirm) {
                    return
                }
                clearAllLocalRecords()
                this.refreshProfileData()
                wx.showToast({
                    title: '记录已清空',
                    icon: 'none',
                })
            },
        })
    },

    refreshProfileData(preferredMode) {
        const app = getApp()
        const runtimeMode = preferredMode || (app && typeof app.getCurrentMode === 'function' ? app.getCurrentMode() : appConfig.mode)
        const bundle = getDataBundle(runtimeMode)

        const litLocationIds = getLitLocations()
        const favoriteEventIds = getFavoriteEvents()

        const litLocations = litLocationIds
            .map((id) => {
                return bundle.locations.find((item) => item.id === id) || getLocationByIdAcrossModes(id)
            })
            .filter(Boolean)

        const favoriteEvents = favoriteEventIds
            .map((id) => {
                return bundle.events.find((item) => item.id === id) || getEventByIdAcrossModes(id)
            })
            .filter(Boolean)

        this.setData({
            currentMode: bundle.mode,
            modeLabel: bundle.mode === 'special' ? '专题版' : '通用版骨架',
            litCount: litLocations.length,
            favoriteCount: favoriteEvents.length,
            litLocations,
            favoriteEvents,
            titleName: getTitleByLitCount(litLocations.length),
        })
    },
})
