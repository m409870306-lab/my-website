import { request, uploadTryOn } from "../../utils/api";
import { getTryOnState, setTask } from "../../utils/tryonState";

Page({
  data: {
    statusText: "正在准备生成",
    taskId: "",
  },

  onLoad() {
    this.startGeneration();
  },

  async startGeneration() {
    const state = getTryOnState();
    if (!state.imagePaths.length || !state.dress) {
      wx.showToast({ title: "请先上传照片并选择礼服", icon: "none" });
      wx.navigateTo({ url: "/pages/upload/upload" });
      return;
    }

    try {
      this.setData({ statusText: "正在上传照片" });
      const response = await uploadTryOn({
        imagePaths: state.imagePaths,
        bodyInfo: state.bodyInfo,
        dressId: state.dress.id,
      });
      setTask(response.task);
      this.setData({ taskId: response.task.id, statusText: "正在处理相似度与体型比例" });
      this.pollTask(response.task.id);
    } catch (error) {
      wx.showModal({ title: "生成失败", content: error.message, showCancel: false });
    }
  },

  async pollTask(taskId) {
    const timer = setInterval(async () => {
      const response = await request({ url: `/api/tryon/${taskId}` });
      setTask(response.task);
      if (response.task.generationStatus === "succeeded") {
        clearInterval(timer);
        wx.redirectTo({ url: "/pages/result/result" });
      }
      if (response.task.generationStatus === "failed") {
        clearInterval(timer);
        wx.showModal({ title: "生成失败", content: response.task.failureReason, showCancel: false });
      }
    }, 1500);
  },
});
