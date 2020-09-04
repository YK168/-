const app = getApp()
const QQMapWX = require('../../SDK/qqmap-wx-jssdk.min')
const qqmapsdk = new QQMapWX({
  key:'GHRBZ-2TKH3-QD33K-3WQE4-NDN66-IOFVQ'
})
Page({

  /**
   * 页面的初始数据
   */
  data: {
    Y:0,//Y轴坐标
    detailY:0,//移动后的坐标
    latitude:0,//纬度
    longitude:0,//经度
    markers:[
      {
        id: 0,
        iconPath:"../../imges/setInitialPoint.png",
        // latitude: 23.099994,
        // longitude: 113.324520,
        width: 30,
        height: 30,
      },
    ],
    mapScale:16,//地图缩放级别
    mapSetting:{
      skew: 0,
      rotate: 0,
      showLocation: true,
      showScale: false,
      subKey: '',
      layerStyle: -1,
      enableZoom: true,
      enableScroll: true,
      enableRotate: true,
      showCompass: false,
      enable3D: false,
      enableOverlooking: false,
      enableSatellite: false,
      enableTraffic: false,
    },//map的配置项
    userInfo:null,//用户信息
    city:"获取城市中...",//城市
    addressName:"请选择车辆停放点",//用户选取的位置名
    userSetLocation:null,//用户选择的点的位置经纬度
    positionState:"定位中...",//用户的定位情况
    isManual:false,//用户是否手动选择了定位
  },

  movableViewBindchange(e){
    let vm = this;
    vm.data.detailY = e.detail.y
  },
  bindtouchend(e){
    let vm = this;
    if(vm.data.Y>0){
      if(vm.data.detailY<-100){
        vm.setData({
          Y:-(wx.getSystemInfoSync().windowHeight)
        })
      }else{
        vm.setData({
          Y:(wx.getSystemInfoSync().windowHeight)
        })
      }
    }else{
      if(vm.data.detailY<-400){
        vm.setData({
          Y:-(wx.getSystemInfoSync().windowHeight)
        })
      }else{
        vm.setData({
          Y:(wx.getSystemInfoSync().windowHeight)
        })
      }
    }
  },
  //使用自己的位置做为停车点
  userLocation(){
    return new Promise((resole,reject)=>{
      let vm = this;
      wx.showLoading({
        title: '定位中',
      })
      wx.getLocation({
        type: 'gcj02',
        isHighAccuracy:true,
        success(res) {
            wx.hideLoading()
            let uplatitude = "markers[0].latitude";
            let uplongitude = "markers[0].longitude";
            let location = {
              latitude:res.latitude,
              longitude:res.longitude,
            };
            vm.setData({
              latitude:res.latitude,
              longitude:res.longitude,
              [uplatitude]:res.latitude,
              [uplongitude]:res.longitude,
              userSetLocation:location,
              mapScale:16,
              positionState:"定位成功，使用我的位置作为车辆停放位置",
            })
            vm.getAddressName(location,false)
            wx.hideLoading()
          resole();
        },
        fail(res){
          wx.hideLoading()
          wx.showToast({
            title: '未授权定位服务',
            icon: 'none',
            duration: 2000
          })
          let latitude=23.099994;
          let longitude=113.324520;
          vm.setData({
            latitude:latitude,
            longitude:longitude,
            mapScale:16,
            positionState:"未开启定位权限",
            city:"未开启定位服务"
          })
          if(app.globalData.isforTheFirstTime){
            app.globalData.isforTheFirstTime = false
          }else{
            wx.hideToast()
            wx.showModal({
              cancelColor: 'cancelColor',
              title:"定位",
              content:"是否开启定位授权",
              cancelText:"取消",
              confirmText:"确定",
              success(res){
                if (res.cancel) {
                  //点击取消,默认隐藏弹框
               } else {
                  //点击确定
                  vm.openPosition();
               }
              }
            })
          }
        }
      })
    })
  },
  //获取自己的定位
  location(){
    return new Promise((resole,reject)=>{
      let vm = this;
      wx.showLoading({
        title: '定位中',
      })
      wx.getLocation({
        type: 'gcj02',
        isHighAccuracy:true,
        success(res) {
          if(vm.data.isManual){
            vm.setData({
              latitude:res.latitude,
              longitude:res.longitude,
              mapScale:16,
              positionState:"使用手动选择的位置作为车辆停放位置",
            })
            wx.hideLoading()
          }else{
            vm.setData({
              latitude:res.latitude,
              longitude:res.longitude,
              mapScale:16,
              positionState:"定位成功，使用我的位置作为车辆停放位置",
            })
            wx.hideLoading()
          }
          resole();
        },
        fail(res){
          wx.hideLoading()
          wx.showToast({
            title: '未授权定位服务',
            icon: 'none',
            duration: 2000
          })
          let latitude=23.099994;
          let longitude=113.324520;
          vm.setData({
            latitude:latitude,
            longitude:longitude,
            mapScale:16,
            positionState:"未开启定位权限",
            city:"未开启定位服务"
          })
          if(app.globalData.isforTheFirstTime){
            app.globalData.isforTheFirstTime = false
          }else{
            wx.hideToast()
            wx.showModal({
              cancelColor: 'cancelColor',
              title:"定位",
              content:"是否开启定位授权",
              cancelText:"取消",
              confirmText:"确定",
              success(res){
                if (res.cancel) {
                  //点击取消,默认隐藏弹框
               } else {
                  //点击确定
                  vm.openPosition();
               }
              }
            })
          }
        }
      })
    })
  },
  //引导用户开启定位授权
  openPosition(){
    let vm = this;
    wx.openSetting({
      withSubscriptions: true,
      success: (result) => {
        if(result.authSetting["scope.userLocation"]){
          vm.location().then(()=>{
            let loaction = {
              latitude:vm.data.latitude,
              longitude:vm.data.longitude,
            }
            vm.getAddressName(loaction,true)
          })
        }
      },
      fail: (res) => {},
      complete: (res) => {},
    })
  },
  //设置起始点
  setInitialPoint(e){
    let vm = this;
    let uplatitude = "markers[0].latitude";
    let uplongitude = "markers[0].longitude";
    let location = {
      latitude:e.detail.latitude,
      longitude:e.detail.longitude,
    };
    vm.setData({
      [uplatitude]:e.detail.latitude,
      [uplongitude]:e.detail.longitude,
      userSetLocation:location,
      positionState:"使用手动选择的位置作为车辆停放位置",
      isManual:true
    })
    vm.getAddressName(location,false)
  },
  //逆地址解析（坐标位置描述）
  getAddressName(location,iscity){
    let vm = this;
    qqmapsdk.reverseGeocoder({
      location:location,
      success:function(res){
        if(iscity){
          vm.setData({
            addressName:res.result.formatted_addresses.rough,
            city:res.result.address_component.city
          })
        }else{
          vm.setData({
            addressName:res.result.formatted_addresses.rough,
          })
        }
      }
    })
  },
  //下单按钮方法
  handleClick(){
    console.log("点了下单")
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let vm = this;
    vm.setData({
      Y:wx.getSystemInfoSync().windowHeight
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    const vm = this;
    vm.location().then(()=>{
      let loaction = {
        latitude:vm.data.latitude,
        longitude:vm.data.longitude,
      }
      vm.getAddressName(loaction,true)
    })
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
    
  }
})