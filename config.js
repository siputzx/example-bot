/*
 * Base Simpel
 * Created By Siputzx Production
 */

global.owner = [
   "212703897448", //ganti nomor owner
   "", //nomor owner kedua kalo ada
];

global.api = require("axios").create({
   baseURL: "https://api.siputzx.my.id/api",
   headers: {
      "Content-Type": "application/json",
      api_key: "free",
      accept: "*/*",
   },
});

let fs = require("fs");
let file = require.resolve(__filename);
fs.watchFile(file, () => {
   fs.unwatchFile(file);
   console.log(`Update ${__filename}`);
   delete require.cache[file];
   require(file);
});
