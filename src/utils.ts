import { StyleSheet } from 'windicss/utils/style';


export function searchNotEscape(text:string, char = "{") {
  if (text.charAt(0) === char) return 0;
  const index = text.search(new RegExp(String.raw`([^\\]${char})`));
  if (index === -1) return -1;
  return index + 1;
}

export function searchGroup(text: string) {
  let level = 1;
  let index = 0;
  let endBracket = searchNotEscape(text, "}");
  while (endBracket !== -1) {
    let nextBracket = searchNotEscape(text.slice(index,), "{");
    if (endBracket < nextBracket || nextBracket === -1) {
      level--;
      index = endBracket + 1;
      if (level == 0) return endBracket;
    } else {
      level++;
      index = nextBracket + 1;
    }
    endBracket = searchNotEscape(text.slice(index,), "}");
  }
  return -1;
}

export function combineStyleList(stylesheets:StyleSheet[]) {
  return stylesheets.reduce((previousValue, currentValue) => previousValue.extend(currentValue), new StyleSheet()).combine();//.sort();
}

export function globalStyleSheet(styleSheet:StyleSheet) {
  // turn all styles in stylesheet to global style
  styleSheet.children.forEach(style=>{
    style.wrapRule((rule:string)=>`:global(${rule})`);
  });
  return styleSheet;
}