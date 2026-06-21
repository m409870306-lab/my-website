function baseUrl() {
  return getApp().globalData.apiBaseUrl;
}

export function request({ url, method = "GET", data }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl()}${url}`,
      method,
      data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || "请求失败"));
        }
      },
      fail: () => reject(new Error("网络连接失败")),
    });
  });
}

export function uploadCustomerImage(filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${baseUrl()}/api/uploads`,
      filePath,
      name: "image",
      success: (res) => {
        const data = JSON.parse(res.data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data.image);
        } else {
          reject(new Error(data.error || "上传图片失败"));
        }
      },
      fail: () => reject(new Error("上传图片失败，请检查网络")),
    });
  });
}

export function uploadTryOn({ imagePaths, bodyInfo, dressId }) {
  return Promise.all(imagePaths.map((filePath) => uploadCustomerImage(filePath))).then((images) => {
    return request({
      url: "/api/tryon",
      method: "POST",
      data: {
        dressId,
        uploadedImageIds: images.map((image) => image.id),
        bodyInfo,
      },
    });
  });
}
