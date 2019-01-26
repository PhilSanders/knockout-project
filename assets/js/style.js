// assets / js / style

const getComputedStyle = (selectorProp, styleProp) => {
  let para = document.querySelector(selectorProp);
  let compStyles = window.getComputedStyle(para);
  return compStyles.getPropertyValue(styleProp);
}

let themePallete = {
  'primary': getComputedStyle('.theme-pallete .primary', 'background-color'),
  'light': getComputedStyle('.theme-pallete .primary-light', 'background-color'),
  'dark': getComputedStyle('.theme-pallete .primary-dark', 'background-color'),
  'highlight': getComputedStyle('.theme-pallete .primary-highlight', 'background-color')
}

module.exports = {
  themePallete: themePallete,
  getComputedStyle: getComputedStyle
}
