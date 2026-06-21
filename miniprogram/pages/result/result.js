import { getTryOnState, resetTryOnState } from "../../utils/tryonState";

Page({
  data: {
    task: null,
    dress: null,
  },

  onLoad() {
    const state = getTryOnState();
    this.setData({
      task: state.task,
      dress: state.dress,
    });
  },

  restart() {
    resetTryOnState();
    wx.reLaunch({ url: "/pages/home/home" });
  },
});
