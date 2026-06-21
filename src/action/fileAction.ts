import { mitLicense } from "@/constants/lic";
import { LicenseOption, licenseType } from "@/interfaces/option";
import fs from "fs";
import { copy, vendorFile } from "@/util/fileUtil";

import pc from "picocolors";
import { get } from "lodash-es";

const licenseMap: Record<licenseType, string> = {
  mit: "mit",
  gpl: "gpl",
  apache: "apache",
  mpl: "mpl",
  lgpl: "lgpl",
};

export function createLicense(lic: licenseType) {
  if (lic === "mit") {
    fs.writeFileSync("LICENSE", mitLicense);
  } else if (licenseMap[lic]) {
    copy(vendorFile(`${lic}.txt`, "lic"), "LICENSE");
  }
  console.log(pc.cyan(`创建${lic}协议文件成功!`));
}

export function createIgnore(ignore: string) {
  console.log(pc.blue(`添加${ignore} ignore中`));

  const ignoreFile = ".gitignore";
  if (!fs.existsSync(ignoreFile)) {
    fs.writeFileSync(ignoreFile, "");
  }

  const flag = `#${ignore}\n`;
  const existing = fs.readFileSync(ignoreFile, "utf-8");
  if (existing.includes(flag)) {
    console.log(pc.red("您已经添加过了"));
    return;
  }

  const data = fs.readFileSync(vendorFile(ignore, "ignore"));
  fs.writeFileSync(ignoreFile, `${existing}\n${flag}${data}\n`);
  console.log(pc.cyan(`添加${ignore}忽略文件成功`));
}
