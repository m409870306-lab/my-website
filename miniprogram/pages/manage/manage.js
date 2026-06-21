import { uploadDress } from "../../utils/api";

Page({
  data: {
    imagePath: "",
    code: "",
    name: "",
    category: "主纱",
    silhouette: "",
    fabric: "",
    neckline: "",
    sleeve: "",
    train: "",
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        this.setData({ imagePath: res.tempFiles[0].tempFilePath });
      },
    });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value });
  },

  async saveDress() {
    if (!this.data.imagePath) {
      wx.showToast({ title: "请先上传礼服照片", icon: "none" });
      return;
    }

    wx.showLoading({ title: "上传中" });
    try {
      await uploadDress({
        imagePath: this.data.imagePath,
        dress: {
          code: this.data.code,
          name: this.data.name,
          category: this.data.category,
          silhouette: this.data.silhouette,
          fabric: this.data.fabric,
          neckline: this.data.neckline,
          sleeve: this.data.sleeve,
          train: this.data.train,
        },
      });
      wx.hideLoading();
      wx.showToast({ title: "礼服已保存" });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (error) {
      wx.hideLoading();
      wx.showModal({ title: "上传失败", content: error.message, showCancel: false });
    }
  },
});
