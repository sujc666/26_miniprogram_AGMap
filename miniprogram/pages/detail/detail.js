const {
    appConfig,
    normalizeMode,
    getDataBundle,
    getEventByIdAcrossModes,
} = require('../../utils/data')
const { isEventFavorited, toggleFavoriteEvent, isEventLit, lightEvent } = require('../../utils/storage')

Page({
    data: {
        appConfig,
        currentMode: 'special',
        eventId: '',
        event: null,
        isFavorited: false,
        isLit: false,
        showCoverImage: true,
    },

    onLoad(options) {
        const eventId = options.id || ''
        const app = getApp()
        const runtimeMode = normalizeMode(
            options.mode || (app && typeof app.getCurrentMode === 'function' ? app.getCurrentMode() : appConfig.mode)
        )

        if (!eventId) {
            wx.showToast({
                title: '活动信息缺失',
                icon: 'none',
            })
            return
        }

        const bundle = getDataBundle(runtimeMode)
        const event = bundle.events.find((item) => item.id === eventId) || getEventByIdAcrossModes(eventId)
        if (!event) {
            wx.showToast({
                title: '未找到活动',
                icon: 'none',
            })
            return
        }

        this.setData({
            currentMode: runtimeMode,
            eventId,
            event,
            isFavorited: isEventFavorited(eventId),
            isLit: isEventLit(eventId),
            showCoverImage: true,
        })
    },

    onShow() {
        const { eventId } = this.data
        if (!eventId) {
            return
        }
        this.setData({
            isFavorited: isEventFavorited(eventId),
            isLit: isEventLit(eventId),
        })
    },

    onCoverImageError() {
        this.setData({ showCoverImage: false })
    },

    onToggleFavorite() {
        const { eventId } = this.data
        if (!eventId) {
            return
        }
        const nextList = toggleFavoriteEvent(eventId)
        const isFavorited = nextList.includes(eventId)

        this.setData({ isFavorited })
        wx.showToast({
            title: isFavorited ? '已加入收藏' : '已取消收藏',
            icon: 'none',
            duration: 1300,
        })
    },

    onLightEvent() {
        const { eventId } = this.data
        if (!eventId) {
            return
        }

        const alreadyLit = isEventLit(eventId)
        if (!alreadyLit) {
            lightEvent(eventId)
        }

        this.setData({ isLit: true })
        wx.showToast({
            title: alreadyLit ? '这个奇遇已经点亮啦' : '奇遇点亮成功',
            icon: 'none',
            duration: 1300,
        })
    },

    onBack() {
        wx.navigateBack({
            fail: () => {
                wx.switchTab({ url: '/pages/home/home' })
            },
        })
    },
})
