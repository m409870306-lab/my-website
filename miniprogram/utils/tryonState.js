const state = {
  imagePaths: [],
  bodyInfo: {
    height: "",
    weight: "",
    size: "",
    beautify: "natural",
  },
  dress: null,
  task: null,
};

export function getTryOnState() {
  return state;
}

export function setCustomerImages(imagePaths) {
  state.imagePaths = imagePaths;
}

export function setBodyInfo(bodyInfo) {
  state.bodyInfo = {
    ...state.bodyInfo,
    ...bodyInfo,
  };
}

export function setDress(dress) {
  state.dress = dress;
}

export function setTask(task) {
  state.task = task;
}

export function resetTryOnState() {
  state.imagePaths = [];
  state.bodyInfo = { height: "", weight: "", size: "", beautify: "natural" };
  state.dress = null;
  state.task = null;
}
