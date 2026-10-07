/** The Lumen prism: a tall diamond with an inner diamond and a center line. */
export const MARK_VIEWBOX = "0 0 130 200";

export const MARK_PATHS = {
  upperFill: "M1 99 L65 1 L129 99 Z",
  outerUpper: "M1 99 L65 1 L129 99",
  outerLower: "M1 99 L65 199 L129 99",
  equator: "M1 99 H129",
  innerUpper: "M28 99 L65 43 L102 99",
  innerLower: "M28 99 L65 157 L102 99",
} as const;
