 

export interface LicenseOption{
    license:licenseType
    open:boolean
}
export type licenseType='mit'|'gpl'|'apache'|'mpl'|'lgpl'
export const opensourceUrl = "https://www.runoob.com/w3cnote/open-source-license.html";
 export const licenses=['mit','gpl','apache','mpl','lgpl']
 export type ignoreType='node'|'dart'|'cs'|'java'|'go'
 export interface IgnoreOption{
    lang:ignoreType
 }