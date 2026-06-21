import { seededDresses } from "../../data/dresses";
import { request } from "../../utils/api";
import { setDress } from "../../utils/tryonState";

Page({
  data: {
    dresses: seededDresses,
    selectedId: "",
  },

  onLoad() {
    this.loadDresses();
  },

  async loadDresses() {
    try {
      const response = await request({ url: "/api/dresses" });
      const apiBaseUrl = getApp().globalData.apiBaseUrl;
      const dresses = response.dresses.map((dress) => ({
        ...dress,
        displayImageUrl: dress.imageUrl && dress.imageUrl.startsWith("/")
          ? `${apiBaseUrl}${dress.imageUrl}`
          : dress.imageUrl,
      }));
      this.setData({ dresses });
    } catch (error) {
      wx.showToast({ title: "使用本地礼服示例", icon: "none" });
      this.setData({ dresses: seededDresses });
    }
  },

  selectDress(event) {
    const dress = this.data.dresses.find((item) => item.id === event.currentTarget.dataset.id);
    this.setData({ selectedId: dress.id });
    setDress(dress);
  },

  next() {
    if (!this.data.selectedId) {
      wx.showToast({ title: "请选择一件礼服", icon: "none" });
      return;
    }
    wx.navigateTo({ url: "/pages/generating/generating" });
  },
});
