const { clone, isEmpty, toDateString, getWhatDay } = require("xe-utils");
const { getTrainRouter, getSeatInfo } = require("../../utils/util");
let setTimeOutFunc = null;

// pages/trainInfo/trainInfo.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    train_no: "",
    train: "",
    date: "",
    activeTrain: "",
    activeList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _that = this;
    if (options) {
      _that.setData({
        train_no: options.train_no,
        train: options.train,
        date: options.date,
      })
      console.log(_that.data);
      getTrainRouter(options.train_no, options.date, options.start, options.end).then(trainRouter => {
        let addDay = 0;
        _that.setData({
          activeList: trainRouter.map((item, index) => {
            if (index > 0) {
              if (trainRouter[index - 1].start_time > item.start_time) {
                addDay += 1;
              }
            }
            console.log(item);
            return {
              ...item,
              addDay,
              loadList: clone(trainRouter.slice(index + 1, trainRouter.length).map((v, loadIndex) => {
                v["seat"] = null;
                return v;
              }), true)
            }
          }),
          activeTrain: trainRouter.findIndex(v => v.station_code == options.start),
        })
        clearTimeout(setTimeOutFunc)
        _that.getSeat(options.start, 0);
      });
    }
  },
  getSeat(startCode, loadIndex) {
    let _that = this;
    const mianIndex = _that.data.activeList.findIndex(v => v.station_code == startCode);
    if (mianIndex == -1) {
      return;
    }
    const startSite = _that.data.activeList[mianIndex];
    if (startSite.loadList.length == 0) {
      return;
    }
    const endCode = startSite.loadList[loadIndex].station_code;
    const date = toDateString(getWhatDay(_that.data.date, startSite.addDay), "yyyy-MM-dd");
    const train = _that.data.train_no;
    getSeatInfo(date, startCode, endCode, train).then(seat => {
      if (isEmpty(seat)) {
        _that.data.activeList[mianIndex].loadList[loadIndex].seat = "error"
      } else {
        _that.data.activeList[mianIndex].loadList[loadIndex].seat = seat;
      }
      _that.setData({
        activeList: _that.data.activeList
      });
      if (loadIndex < startSite.loadList.length - 1) {
        setTimeOutFunc = setTimeout(() => {
          _that.getSeat(startCode, loadIndex + 1);
        }, 1200);
      }
    })
  },
  collapseChange({ detail }) {
    console.log(detail, this.data.activeList[this.data.activeTrain]);
    this.data.activeList[this.data.activeTrain].loadList.map(v => {
      v.seat = null;
    })

    this.setData({
      activeTrain: detail,
      activeList: this.data.activeList
    })
    clearTimeout(setTimeOutFunc)
    this.getSeat(this.data.activeList[detail].station_code, 0);
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
    clearTimeout(setTimeOutFunc)
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

  }
})