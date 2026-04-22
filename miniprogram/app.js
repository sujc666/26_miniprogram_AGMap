const { appConfig, normalizeMode } = require('./utils/data')

const MODE_STORAGE_KEY = 'weizai_app_mode'

App({
    globalData: {
        appConfig,
        currentMode: appConfig.mode,
    },

    onLaunch() {
        const savedMode = wx.getStorageSync(MODE_STORAGE_KEY)
        if (savedMode) {
            this.globalData.currentMode = normalizeMode(savedMode)
        }

        const logs = wx.getStorageSync('weizai_launch_logs') || []
        logs.unshift(Date.now())
        wx.setStorageSync('weizai_launch_logs', logs.slice(0, 30))
    },

    getCurrentMode() {
        return normalizeMode(this.globalData.currentMode)
    },

    setCurrentMode(mode) {
        const nextMode = normalizeMode(mode)
        this.globalData.currentMode = nextMode
        wx.setStorageSync(MODE_STORAGE_KEY, nextMode)
        return nextMode
    },
})
