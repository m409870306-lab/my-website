import { setBodyInfo } from "../../utils/tryonState";

Page({
  data: {
    height: "",
    weight: "",
    size: "",
    beautify: "natural",
    sizes: ["S", "M", "L", "XL"],
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value });
  },

  onSizeChange(event) {
    this.setData({ size: this.data.sizes[Number(event.detail.value)] });
  },

  next() {
    setBodyInfo({
      height: this.data.height,
      weight: this.data.weight,
      size: this.data.size,
      beautify: this.data.beautify,
    });
    wx.navigateTo({ url: "/pages/dresses/dresses" });
  },
});
