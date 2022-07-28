export interface LicenseOption {
  license: licenseType;
  open: boolean;
}
export type licenseType = "mit" | "gpl" | "apache" | "mpl" | "lgpl";
export const opensourceUrl =
  "https://www.runoob.com/w3cnote/open-source-license.html";
export const licenses = ["mit", "gpl", "apache", "mpl", "lgpl"];
export const ignores=['node','dart','cs','java','go']
 
export type ignoreType = typeof ignores[number]
export interface IgnoreOption {
  lang: ignoreType;
}
