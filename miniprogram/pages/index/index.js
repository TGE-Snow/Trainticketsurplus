// index.js
// 获取应用实例
const app = getApp()
const { getStationName, getWeekStr, getTrainInfo } = require('../../utils/util.js')
const { toDateString, isEmpty } = require("xe-utils")

Page({
  data: {
    calendarShow: false,
    calendarDay: "",
    calendarWeek: "",
    calendarDate: "",
    trainStart: "起始站",
    trainStartCode: null,
    trainEnd: "终点站",
    trainEndCode: null,
    searchRequest: true,
    trainInfoList: []
  },

  onLoad() {
    getStationName();
    const history = wx.getStorageSync('history');

    if (isEmpty(history)) {
      const dateS = this.getDateInfo(new Date());
      this.setData({
        calendarDay: dateS.day,
        calendarWeek: dateS.week,
        calendarDate: dateS.date
      });
    } else {
      this.setData({
        calendarDay: history.calendarDay,
        calendarWeek: history.calendarWeek,
        calendarDate: history.calendarDate,
        trainStart: history.trainStart,
        trainStartCode: history.trainStartCode,
        trainEnd: history.trainEnd,
        trainEndCode: history.trainEndCode,
      });
    }



  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const trainData = wx.getStorageSync('selectTrain');
    wx.removeStorageSync('selectTrain')
    if (!isEmpty(trainData)) {
      switch (trainData.type) {
        case "start":
          this.setData({
            trainStart: trainData.name,
            trainStartCode: trainData.code
          })
          break;
        case "end":
          this.setData({
            trainEnd: trainData.name,
            trainEndCode: trainData.code
          })
          break;
      }
    }

  },

  selectDate() {
    this.setData({
      calendarShow: true
    });
  },
  calendarClose() {
    this.setData({
      calendarShow: false
    });
  },
  calendarConfirm(value) {
    const dateS = this.getDateInfo(value.detail);

    this.setData({
      calendarShow: false,
      calendarDay: dateS.day,
      calendarWeek: dateS.week,
      calendarDate: dateS.date
    });
  },
  getDateInfo(date) {
    const dateSplic = toDateString(date, "M月d日&e&yyyy-MM-dd").split("&");
    return {
      day: dateSplic[0],
      week: getWeekStr(dateSplic[1]),
      date: dateSplic[2]
    }
  },
  selectTrainStart() {
    this.selectTrain("start")
  },
  selectTrainEnd() {
    this.selectTrain("end")
  },
  selectTrain(value) {
    wx.navigateTo({
      url: '/pages/selectTrain/selectTrain?type=' + value,
    })
  },
  changeTrain() {

    const startStr = this.data.trainStartCode ? this.data.trainStart : "终点站";
    const startCode = this.data.trainStartCode

    this.setData({
      trainStart: this.data.trainEndCode ? this.data.trainEnd : "起始站",
      trainStartCode: this.data.trainEndCode,
      trainEnd: startStr,
      trainEndCode: startCode
    })
  },
  searchTrain() {
    let _that = this;

    if (isEmpty(this.data.trainStartCode) || isEmpty(this.data.trainEndCode)) {
      wx.showToast({
        icon: "error",
        title: '请选择起始站或终点站',
      })
      return;
    }

    if (_that.data.searchRequest) {
      _that.data.searchRequest = false;
      getTrainInfo(this.data.calendarDate, this.data.trainStartCode, this.data.trainEndCode).then(v => {
        _that.data.searchRequest = true;
        _that.setData({
          trainInfoList: v
        });

        const history = {
          calendarDay: _that.data.calendarDay,
          calendarWeek: _that.data.calendarWeek,
          calendarDate: _that.data.calendarDate,
          trainStart: _that.data.trainStart,
          trainStartCode: _that.data.trainStartCode,
          trainEnd: _that.data.trainEnd,
          trainEndCode: _that.data.trainEndCode,
        }
        wx.setStorageSync('history', history)
      });
    }
  },
  clickTrain(e) {
    const data = e.currentTarget.dataset['item'];
    wx.navigateTo({
      url: `/pages/trainInfo/trainInfo?train=${data.station_train_code}&train_no=${data.train_no}&start=${data.from_station_telecode}&end=${data.end_station_telecode}&date=${this.data.calendarDate}`,
    })
  },
  scrollView({ detail }) {
    console.log(detail);
  }
})
