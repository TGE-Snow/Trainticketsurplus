const { isEmpty, toDateString, now } = require("xe-utils")

const getToken = (from_station, to_station, fromDate) => {

  let fromsta = "%u5929%u6D25%2CTJP"
  let tosta = "%u5317%u4EAC%2CBJP";

  const trainCode = wx.getStorageSync('trainCode')
  if (!isEmpty(trainCode)) {
    fromsta = escape(`${trainCode[from_station]},`) + from_station;
    tosta = escape(`${trainCode[to_station]},`) + to_station;
  }
  return `_uab_collina=${now()}21770905131; JSESSIONID=A0B4F314CDD632EAF995A861ACC8DBED; BIGipServerpassport=937951498.50215.0000; guidesStatus=off; highContrastMode=defaltMode; cursorStatus=off; route=9036359bb8a8a461c164a04f8f50b252; BIGipServerindex=1054408970.43286.0000; BIGipServerotn=1691943178.64545.0000; _jc_save_fromStation=${fromsta}; _jc_save_toStation=${tosta}; _jc_save_fromDate=${fromDate}; _jc_save_toDate=${fromDate}; _jc_save_wfdc_flag=dc; fo=5e3jewwg6jpml5bh2Z630qcrrus7a_W4443SrMAGFysV5Y6MVARq_5FspB_xf-hAVdwsrpfgbOR5nR4FkLb6o4oLYaIR89twaK7tpFXHCswh-1UfVHdZ0_Idq47BlP0f989F72jmf5Vxd9bGkoWPtRYSEWm7Frt1_8rFnZcAj47hpHKQPyqkxPDECx0`
}

const utf8 = (str) => {//中文编码转为utf8
  var UTFTranslate = {
    Change: function (pValue) {
      return pValue.replace(/[^\u0000-\u00FF]/g, function ($0) { return escape($0).replace(/(%u)(\w{4})/gi, "&#x$2;") });
    },
    ReChange: function (pValue) {
      return unescape(pValue.replace(/&#x/g, '%u').replace(/\\u/g, '%u').replace(/;/g, ''));
    }
  };
  return UTFTranslate.Change(str); // "&#x4E2D;&#x6587;sdfsf"
}

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const codeAt = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

/**
 * 获取车站名称
 */
const getStationName = () => {
  const station = wx.getStorageSync('stationName')
  if (!station) {
    wx.request({
      url: 'https://www.12306.cn/index/script/core/common/station_name_new_v10004.js',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        wx.reportEvent && wx.reportEvent("wxdata_perf_monitor", {
          "wxdata_perf_monitor_id": "station_name_new_v10004.js",
          "wxdata_perf_monitor_level": 1,
          "wxdata_perf_error_code": 0,
          "wxdata_perf_error_msg": "",
          "wxdata_perf_cost_time": 0
        })
        let trainCode = {}
        const stationNameList = res.data.replace(";", "").split("@");
        stationNameList.splice(0, 1);
        let stationObj = {};
        stationNameList.forEach(item => {
          const fStr = item.charCodeAt(0);
          const itemList = item.split("|");
          if (!stationObj[fStr]) {
            stationObj[fStr] = []
          }
          trainCode[itemList[2]] = itemList[1];
          stationObj[fStr].push({
            fsx: itemList[0] ?? "",
            name: itemList[1] ?? "",
            sx: itemList[3] ?? "",
            city: itemList[7] ?? "",
            code: itemList[2] ?? "",
          })
        });
        let stationList = [];
        Object.keys(stationObj).forEach(v => {
          stationList.push({
            sx: codeAt[v - 97],
            list: stationObj[v]
          });
        })
        wx.setStorageSync('trainCode', trainCode)
        wx.setStorageSync('stationName', stationList)
      },
      fail(res) {
        wx.reportEvent && wx.reportEvent("wxdata_perf_monitor", {
          "wxdata_perf_monitor_id": "station_name_new_v10004.js",
          "wxdata_perf_monitor_level": 1,
          "wxdata_perf_error_code": 1,
          "wxdata_perf_error_msg": JSON.stringify(res),
          "wxdata_perf_cost_time": 0
        })
      }
    })
  }
}

/**
 * 获取起始至终点站的列车
 * @param {*} date 时间
 * @param {*} start 起始列车Code
 * @param {*} end 终点列车Code
 */
const getTrainInfo = (date, start, end) => {
  return new Promise((reslove) => {
    wx.showLoading({
      title: '数据加载中',
    })
    wx.request({
      url: `https://kyfw.12306.cn/otn/leftTicket/query?leftTicketDTO.train_date=${date}&leftTicketDTO.from_station=${start}&leftTicketDTO.to_station=${end}&purpose_codes=ADULT`,
      header: {
        'content-type': 'application/json', // 默认值
        'Cookie': getToken(start, end, date)
      },
      success(res) {
        wx.reportEvent && wx.reportEvent("wxdata_perf_monitor", {
          "wxdata_perf_monitor_id": "获取起始至终点站的列车",
          "wxdata_perf_monitor_level": 1,
          "wxdata_perf_error_code": 0,
          "wxdata_perf_error_msg": JSON.stringify({ date, start, end }),
          "wxdata_perf_cost_time": 0
        })

        const { data } = res.data;
        if (isEmpty(data)) {
          wx.hideLoading()
          wx.showToast({
            icon: "error",
            title: '暂无改区间的列车!',
          })
          reslove([])
        } else {
          let retData = [];
          if (data.result.length > 0) {
            const trainCode = wx.getStorageSync('trainCode')
            data.result.forEach(v => {
              const trainInfo = v.split("|");
              console.log(trainInfo[3], {
                train_no: trainInfo[2],
                station_train_code: trainInfo[3],
                start_station_telecode: trainInfo[4],
                start_station_telecodeStr: trainCode[trainInfo[4]],
                end_station_telecode: trainInfo[5],
                end_station_telecodeStr: trainCode[trainInfo[5]],
                from_station_telecode: trainInfo[6],
                from_station_telecodeStr: trainCode[trainInfo[6]],
                to_station_telecode: trainInfo[7],
                to_station_telecodeStr: trainCode[trainInfo[7]],
                start_time: trainInfo[8],
                arrive_time: trainInfo[9],
                lishi: trainInfo[10],
                start_train_date: trainInfo[13],
                train_seat_feature: trainInfo[14],
                location_code: trainInfo[15],
                from_station_no: trainInfo[16],
                to_station_no: trainInfo[17],
                is_support_card: trainInfo[18],
                controlled_train_flag: trainInfo[19],
                gg_num: trainInfo[20] ? trainInfo[20] : null,
                gr_num: trainInfo[21] ? trainInfo[21] : null,
                qt_num: trainInfo[22] ? trainInfo[22] : null,
                rw_num: trainInfo[23] ? trainInfo[23] : null,
                rz_num: trainInfo[24] ? trainInfo[24] : null,
                tz_num: trainInfo[25] ? trainInfo[25] : null,
                wz_num: trainInfo[26] ? trainInfo[26] : null,
                yb_num: trainInfo[27] ? trainInfo[27] : null,
                yw_num: trainInfo[28] ? trainInfo[28] : null,
                yz_num: trainInfo[29] ? trainInfo[29] : null,
                ze_num: trainInfo[30] ? trainInfo[30] : null,
                zy_num: trainInfo[31] ? trainInfo[31] : null,
                swz_num: trainInfo[32] ? trainInfo[32] : null,
                srrb_num: trainInfo[33] ? trainInfo[33] : null
              });
              retData.push({
                train_no: trainInfo[2],
                station_train_code: trainInfo[3],
                start_station_telecode: trainInfo[4],
                start_station_telecodeStr: trainCode[trainInfo[4]],
                end_station_telecode: trainInfo[5],
                end_station_telecodeStr: trainCode[trainInfo[5]],
                from_station_telecode: trainInfo[6],
                from_station_telecodeStr: trainCode[trainInfo[6]],
                to_station_telecode: trainInfo[7],
                to_station_telecodeStr: trainCode[trainInfo[7]],
                start_time: trainInfo[8],
                arrive_time: trainInfo[9],
                lishi: trainInfo[10],
                start_train_date: trainInfo[13],
                train_seat_feature: trainInfo[14],
                location_code: trainInfo[15],
                from_station_no: trainInfo[16],
                to_station_no: trainInfo[17],
                is_support_card: trainInfo[18],
                controlled_train_flag: trainInfo[19],
                gg_num: trainInfo[20] ? trainInfo[20] : null,
                gr_num: trainInfo[21] ? trainInfo[21] : null,
                qt_num: trainInfo[22] ? trainInfo[22] : null,
                rw_num: trainInfo[23] ? trainInfo[23] : null,
                rz_num: trainInfo[24] ? trainInfo[24] : null,
                tz_num: trainInfo[25] ? trainInfo[25] : null,
                wz_num: trainInfo[26] ? trainInfo[26] : null,
                yb_num: trainInfo[27] ? trainInfo[27] : null,
                yw_num: trainInfo[28] ? trainInfo[28] : null,
                yz_num: trainInfo[29] ? trainInfo[29] : null,
                ze_num: trainInfo[30] ? trainInfo[30] : null,
                zy_num: trainInfo[31] ? trainInfo[31] : null,
                swz_num: trainInfo[32] ? trainInfo[32] : null,
                srrb_num: trainInfo[33] ? trainInfo[33] : null
              })
            })
          }
          wx.hideLoading()
          reslove(retData);
        }

      },
      fail(res) {
        wx.reportEvent && wx.reportEvent("wxdata_perf_monitor", {
          "wxdata_perf_monitor_id": "获取起始至终点站的列车",
          "wxdata_perf_monitor_level": 1,
          "wxdata_perf_error_code": 1,
          "wxdata_perf_error_msg": JSON.stringify(res),
          "wxdata_perf_cost_time": 0
        })
      }
    })
  })
}

/**
 * 获取车票信息
 * @param {*} date 时间
 * @param {*} start 起始站
 * @param {*} end 终点站
 * @param {*} train 列车编号
 */
const getSeatInfo = (date, start, end, train) => {
  return new Promise((reslove) => {
    wx.showLoading({
      title: '数据加载中',
    })
    wx.request({
      url: `https://kyfw.12306.cn/otn/leftTicket/query?leftTicketDTO.train_date=${date}&leftTicketDTO.from_station=${start}&leftTicketDTO.to_station=${end}&purpose_codes=ADULT`,
      header: {
        'content-type': 'application/json', // 默认值
        'Cookie': getToken(start, end, date)
      },
      success(res) {
        wx.reportEvent && wx.reportEvent("wxdata_perf_monitor", {
          "wxdata_perf_monitor_id": "获取车票信息",
          "wxdata_perf_monitor_level": 1,
          "wxdata_perf_error_code": 0,
          "wxdata_perf_error_msg": JSON.stringify({ date, start, end, train }),
          "wxdata_perf_cost_time": 0
        })
        const { data } = res.data;
        if (isEmpty(data)) {
          wx.hideLoading()
          wx.showToast({
            icon: "error",
            title: '数据获取异常',
          })
          reslove(null)
        } else {
          let retData = null;
          if (data.result.length > 0) {
            for (let index = 0; index < data.result.length; index++) {
              const element = data.result[index];
              const trainInfo = element.split("|");
              if (trainInfo[2] === train) {
                retData = {
                  gg_num: trainInfo[20] ? trainInfo[20] : null,
                  gr_num: trainInfo[21] ? trainInfo[21] : null,
                  qt_num: trainInfo[22] ? trainInfo[22] : null,
                  rw_num: trainInfo[23] ? trainInfo[23] : null,
                  rz_num: trainInfo[24] ? trainInfo[24] : null,
                  tz_num: trainInfo[25] ? trainInfo[25] : null,
                  wz_num: trainInfo[26] ? trainInfo[26] : null,
                  yb_num: trainInfo[27] ? trainInfo[27] : null,
                  yw_num: trainInfo[28] ? trainInfo[28] : null,
                  yz_num: trainInfo[29] ? trainInfo[29] : null,
                  ze_num: trainInfo[30] ? trainInfo[30] : null,
                  zy_num: trainInfo[31] ? trainInfo[31] : null,
                  swz_num: trainInfo[32] ? trainInfo[32] : null,
                  srrb_num: trainInfo[33] ? trainInfo[33] : null
                }
                break;
              }
            }
          }
          wx.hideLoading()
          reslove(retData);
        }
      },
      fail(res) {
        wx.reportEvent && wx.reportEvent("wxdata_perf_monitor", {
          "wxdata_perf_monitor_id": "获取车票信息",
          "wxdata_perf_monitor_level": 1,
          "wxdata_perf_error_code": 1,
          "wxdata_perf_error_msg": JSON.stringify(res),
          "wxdata_perf_cost_time": 0
        })
      }
    })
  })
}

/**
 * 获取列车途经站
 * @param {*} train_no 
 * @param {*} date 
 * @param {*} start 
 * @param {*} end 
 */
const getTrainRouter = (train_no, date, start, end) => {
  return new Promise((reslove) => {
    wx.showLoading({
      title: '数据加载中',
    })
    wx.request({
      url: `https://kyfw.12306.cn/otn/czxx/queryByTrainNo?train_no=${train_no}&from_station_telecode=${start}&to_station_telecode=${end}&depart_date=${date}`,
      header: {
        'content-type': 'application/json', // 默认值
        'Cookie': getToken(start, end, date)
      },
      success(res) {
        wx.reportEvent && wx.reportEvent("wxdata_perf_monitor", {
          "wxdata_perf_monitor_id": "获取列车途经站",
          "wxdata_perf_monitor_level": 1,
          "wxdata_perf_error_code": 0,
          "wxdata_perf_error_msg": JSON.stringify({ train_no, date, start, end }),
          "wxdata_perf_cost_time": 0
        })
        const { data } = res.data;
        if (isEmpty(data)) {
          wx.hideLoading()
          wx.showToast({
            icon: "error",
            title: '数据获取异常',
          })
          reslove(null)
        } else {
          const trainCode = wx.getStorageSync('trainCode')
          let retData = [];
          const dataItem = data.data;
          if (dataItem.length > 0) {
            dataItem.forEach(item => {
              retData.push({
                arrive_time: item.arrive_time,
                start_time: item.start_time,
                station_name: item.station_name,
                station_no: item.station_no,
                stopover_time: item.stopover_time,
                station_code: Object.entries(trainCode).find(([key, val]) => val === item.station_name)[0]
              });
            });
          }
          wx.hideLoading()
          reslove(retData);
        }
      },
      fail(res) {
        wx.reportEvent && wx.reportEvent("wxdata_perf_monitor", {
          "wxdata_perf_monitor_id": "获取车票信息",
          "wxdata_perf_monitor_level": 1,
          "wxdata_perf_error_code": 1,
          "wxdata_perf_error_msg": JSON.stringify(res),
          "wxdata_perf_cost_time": 0
        })
      }
    })
  })
}

/**
 * 获取星期的文本
 * @param {*} value 0~6
 */
const getWeekStr = (value) => {
  switch (Number(value)) {
    case 0:
      return "周日";
    case 1:
      return "周一";
    case 2:
      return "周二";
    case 3:
      return "周三";
    case 4:
      return "周四";
    case 5:
      return "周五";
    case 6:
      return "周六";
  }
}

module.exports = {
  formatTime,
  getStationName,
  getWeekStr,
  getTrainInfo,
  getTrainRouter,
  getSeatInfo
}
