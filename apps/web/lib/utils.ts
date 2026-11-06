import { createCn } from "cn/config";

const GEIST_TYPE = /^(heading|copy|label|button)-\d+(-mono)?$/;

export const cn = createCn({
  extend: { classGroups: { "font-size": [{ text: [(value: string) => GEIST_TYPE.test(value)] }] } },
});
