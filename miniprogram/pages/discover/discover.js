const { appConfig, categoryOptions, getDataBundle } = require('../../utils/data')

function toSearchText(value) {
    return (value || '').toString().trim().toLowerCase()
}

Page({
    data: {
        appConfig,
        categoryOptions,
        currentMode: 'special',
        topicTitle: '',
        topicSubtitle: '',
        selectedCategory: '全部',
        keyword: '',
        filteredEvents: [],
        showEmptyImage: true,
    },

    onLoad() {
        this.refreshRuntimeData()
    },

    onShow() {
        this.refreshRuntimeData()
    },

    onKeywordInput(e) {
        this.setData({ keyword: e.detail.value || '' })
        this.applyFilter()
    },

    onClearKeyword() {
        this.setData({ keyword: '' })
        this.applyFilter()
    },

    onCategoryTap(e) {
        const { category } = e.currentTarget.dataset
        if (!category || category === this.data.selectedCategory) {
            return
        }
        this.setData({ selectedCategory: category })
        this.applyFilter()
    },

    onToggleMode() {
        const app = getApp()
        const currentMode = app && typeof app.getCurrentMode === 'function' ? app.getCurrentMode() : this.data.currentMode
        const nextMode = currentMode === 'special' ? 'general' : 'special'
        const appliedMode = app && typeof app.setCurrentMode === 'function' ? app.setCurrentMode(nextMode) : nextMode

        this.refreshRuntimeData()
        wx.showToast({
            title: appliedMode === 'special' ? '切回专题版啦' : '已切到通用版骨架',
            icon: 'none',
            duration: 1300,
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

    onEmptyImageError() {
        this.setData({ showEmptyImage: false })
    },

    refreshRuntimeData() {
        const app = getApp()
        const runtimeMode = app && typeof app.getCurrentMode === 'function' ? app.getCurrentMode() : appConfig.mode
        const bundle = getDataBundle(runtimeMode)

        this.runtimeEvents = bundle.events || []
        this.setData({
            currentMode: runtimeMode,
            topicTitle: bundle.topic ? bundle.topic.title : appConfig.specialTopicTitle,
            topicSubtitle: bundle.topic ? bundle.topic.subtitle : appConfig.specialTopicSubtitle,
        })
        this.applyFilter()
    },

    applyFilter() {
        const keyword = toSearchText(this.data.keyword)
        const selectedCategory = this.data.selectedCategory

        const filteredEvents = (this.runtimeEvents || [])
            .filter((item) => {
                const categoryMatched = selectedCategory === '全部' || item.category === selectedCategory
                if (!categoryMatched) {
                    return false
                }
                if (!keyword) {
                    return true
                }
                const titleMatched = toSearchText(item.title).includes(keyword)
                const clubMatched = toSearchText(item.club).includes(keyword)
                return titleMatched || clubMatched
            })
            .map((item) => ({
                ...item,
                tagLine: item.tags.slice(0, 2).join(' · '),
            }))

        this.setData({ filteredEvents })
    },
})
