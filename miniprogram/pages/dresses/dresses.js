import { seededDresses } from "../../data/dresses";
import { setDress } from "../../utils/tryonState";

Page({
  data: {
    dresses: seededDresses,
    selectedId: "",
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
