import MagicString from 'magic-string';
import { walk, parse } from 'svelte/compiler';
import { StyleSheet } from 'windicss/src/utils/style';
import { compile, interpret, preflight } from 'windicss/src';

import type { TemplateNode } from 'svelte/types/compiler/interfaces'
import type { Preprocessor } from 'svelte/types/compiler/preprocess';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

let IGNORED_CLASSES:string[] = [];
let STYLESHEETS:StyleSheet[] = [];
let DIRECTIVES:StyleSheet[] = [];
let FILES:(string|undefined)[] = [];

let TAGNAMES:{[key:string]:string|undefined} = {};
let OPTIONS = {
  prefix: 'windi-',
  compile: false,
};

function combineStyleList(stylesheets:StyleSheet[]) {
  // Fix reduce of empty array with no initial value
  if (stylesheets.length === 0) return;
  return stylesheets.reduce((previousValue, currentValue) => previousValue.extend(currentValue)).combine();//.sort();
}

function compilation(classNames:string) {
  const utility = compile(classNames, OPTIONS.prefix, false);
  IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
  STYLESHEETS.push(utility.styleSheet);
  return [utility.className, ...utility.ignored].join(' ');
}

function interpretation(classNames:string) {
  const utility = interpret(classNames);
  IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
  const styleSheet = utility.styleSheet;
  styleSheet.children.forEach(style=>{
    style.selector = `windicssGlobal(${style.selector})`; // should be :global, but : will be escape, so we will replace it with :global later
  });
  STYLESHEETS.push(styleSheet);
}

function getReduceValue(node:TemplateNode, key="consequent"):TemplateNode|string|undefined {
  if (!node) return;
  const value = node[key];
  if (!value) return;
  if (value.raw) return value.value;
  return getReduceValue(value, key);
}


const _preprocess:Preprocessor = ({content, filename}) => {
  let updatedTags = [];
  const parsed = parse(content);
  const code = new MagicString(content);
  
  walk(parsed.html, {
    enter(node:TemplateNode) {
      if (node.type === 'Element' && (!TAGNAMES[node.name])) {
        TAGNAMES[node.name] = filename;
        updatedTags.push(node.name); // only work on production
      };
      if (node.type === 'Class') {
        // handle class directive
        const utility = interpret(node.name);
        IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
        DIRECTIVES.push(utility.styleSheet);
        // make sure directives add after all classes.
      }
      if (node.type==="ConditionalExpression") {
        // handle inline conditional expression
        const utility = interpret(`${getReduceValue(node, 'consequent')} ${getReduceValue(node, 'alternate')}`);
        IGNORED_CLASSES = [...IGNORED_CLASSES, ...utility.ignored];
        DIRECTIVES.push(utility.styleSheet);
      }
      // console.log(node.type);
      if (node.type === 'Attribute' && node.name === 'class') {
        node.value.forEach(({start, end, data}:{start:number, end:number, data:string}) => {
          if (OPTIONS.compile) {
            // compilation mode
            code.overwrite(start, end, compilation(data));
          } else {
            // interpretation mode
            interpretation(data);
          }
        })
      };
    }
  });

  if (FILES.indexOf(filename) !== -1) {
    // hot reload
    for (let [key,value] of Object.entries(TAGNAMES)) {
      if (value === filename) updatedTags.push(key);
    }
  };

  // preflights might lost when refresh
  const preflights = preflight(dev?Object.keys(TAGNAMES):updatedTags, FILES.length === 0 || FILES.indexOf(filename) === 0); // only enable global styles for first file
  
  preflights.children.forEach(style=>{
    style.selector = `:global(${style.selector})`;
  });

  let stylesheet = preflights;
  stylesheet = stylesheet.extend(combineStyleList(STYLESHEETS));
  stylesheet = stylesheet.extend(combineStyleList(DIRECTIVES));
  let tailwindcss = stylesheet.build();
  
  if (!OPTIONS.compile) tailwindcss = tailwindcss.replace(/windicssGlobal\(\\\./g, ':global(.');
  
  if (parsed.css === undefined) {
    code.trimEnd().append(`\n\n<style>\n${tailwindcss}</style>`);
  };

  walk(parsed.css, {
    enter(node:TemplateNode) {
      if (node.type === 'Style') {
        code.prependLeft(node.content.start, '\n'+tailwindcss);
      }
    }
  })

  if (!FILES.includes(filename)) FILES.push(filename); // later for judge should update or not
  STYLESHEETS = [];
  DIRECTIVES = [];
  IGNORED_CLASSES = [];

  return {code: code.toString()};
}

export function preprocess(options={}) {
  OPTIONS = {...OPTIONS, ...options}; // change global settings here;
  return _preprocess;
}