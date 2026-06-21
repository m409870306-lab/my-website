import { setCustomerImages } from "../../utils/tryonState";

Page({
  data: {
    imagePaths: [],
    slots: ["正面照", "五官参考", "全身比例"],
  },

  chooseImages() {
    wx.chooseMedia({
      count: 3,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const imagePaths = res.tempFiles.map((file) => file.tempFilePath).slice(0, 3);
        this.setData({ imagePaths });
        setCustomerImages(imagePaths);
      },
    });
  },

  next() {
    if (this.data.imagePaths.length < 1) {
      wx.showToast({ title: "请至少上传 1 张正面照", icon: "none" });
      return;
    }
    wx.navigateTo({ url: "/pages/body/body" });
  },
});
