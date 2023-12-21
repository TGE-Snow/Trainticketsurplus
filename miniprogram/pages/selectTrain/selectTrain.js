const { isEmpty, assign } = require("xe-utils");

// pages/selectTrain.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        stationList: [],
        selectShow: false,
        searchList: [],
        searchValue: "",
        type: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        })
        if (!isEmpty(options.type)) {
            this.data.type = options.type;
        }
        const station = wx.getStorageSync('stationName');
        this.setData({
            stationList: station.map(v => {
                return {
                    ...v,
                    expand: false
                }
            })
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },

    searchFocus() {
        this.setData({
            selectShow: true
        })
    },

    popupClose() {
        this.setData({
            selectShow: false,
            searchValue: null,
            searchList: []
        })
    },

    searchInput({ detail }) {
        if (isEmpty(detail)) {
            this.setData({
                searchList: []
            })
        } else {
            let searchlist = [];
            for (let index = 0; index < this.data.stationList.length; index++) {
                const statList = this.data.stationList[index];

                for (let subIndex = 0; subIndex < statList.list.length; subIndex++) {
                    const subData = statList.list[subIndex];
                    if (searchlist.length < 15) {
                        if (subData.fsx.indexOf(detail) > -1 || subData.name.indexOf(detail) > -1 || subData.sx.indexOf(detail) > -1) {
                            searchlist.push(subData)
                        }
                    } else {
                        this.setData({
                            searchList: searchlist
                        })
                        return;
                    }
                }
            }
            this.setData({
                searchList: searchlist
            })
        }

    },
    expandFunc(e) {
        const index = e.currentTarget.dataset['index'];
        this.data.stationList[index].expand = !this.data.stationList[index].expand;
        this.setData({
            stationList: this.data.stationList
        })
    },
    selectTrain(e) {
        const data = e.currentTarget.dataset['item'];
        wx.setStorageSync('selectTrain', assign(data, { type: this.data.type }))
        wx.navigateBack({
            delta: 0,
        })
    }
})