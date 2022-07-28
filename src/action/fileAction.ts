import { mitLicense } from "@/constants/lic";
import { LicenseOption, licenseType } from "@/interfaces/option";
import * as fs from "fs";
import { copy, vendorFile } from "@/util/fileUtil";
import * as path from "path";
import pc from "picocolors";
import { fileURLToPath } from "url";

export function createLicense(lic: licenseType) {
  let LICENSE = "LICENSE";
  if (lic == "mit") {
    fs.writeFile("LICENSE", mitLicense, (err) => {
      if (err) {
        console.log(pc.red("error occured=>" + err.message));
        throw err;
      }
    });
  }
  if (lic == "gpl") {
    copy(vendorFile("gpl.txt", "lic"), LICENSE);
  }
  if ((lic =="apache")) {
    copy(vendorFile("apache.txt", "lic"), LICENSE);
  }
  if ((lic == "mpl")) {
    copy(vendorFile("mpl.txt", "lic"), LICENSE);
  }
  if ((lic =="lgpl")) {
    copy(vendorFile("lgpl.txt", "lic"), LICENSE);
  }
  console.log(pc.cyan("创建" + lic + "协议文件成功!"));
}
export function createIgnore(ignore: string) {
  console.log(pc.blue(`添加${ignore} ignore中`));

  let exist = fs.existsSync(".gitignore");
  let ignoreFile = ".gitignore";
  if (!exist) {
    fs.writeFileSync(ignoreFile, "");
  }
  let flag = `#${ignore}\n`;

  let data = fs.readFileSync(vendorFile(ignore, "ignore"));
  let ignoredata = fs.readFileSync(ignoreFile);
  if (ignoredata.toString().includes(flag)) {
    console.log(pc.red("您已经添加过了"));
    return;
  }
  let ignoreString = flag + data;

  fs.open(ignoreFile, "w", function (err, fd) {
    //创建写入内容缓冲区
    if (err) {
      throw err;
    }

    fs.write(
      fd,
      `${data}\n${ignoreString}`,
      0,

      function (err, written, buffer) {
        if (err) {
          console.log(err);
          throw err;
        } else {
          console.log(pc.cyan(`添加${ignore}忽略文件成功`));
        }
      }
    );
  });
}
