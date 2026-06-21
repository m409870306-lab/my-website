import { createApp } from "./app.js";
import { getConfig } from "./config.js";

const config = getConfig();
const app = createApp();

app.listen(config.port, () => {
  console.log(`Wedding try-on server listening on ${config.port}`);
});
