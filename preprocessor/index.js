import MagicString from 'magic-string'
import { walk, parse } from 'svelte/compiler'
import { ClassList } from './parser'
import { hash } from './utils'

const TAILWIND_CLASSES = {}


function cleanClasses(classValue) {
  let inline_classes = classValue.split(/[ ]+/).filter((v, i, a) => a.indexOf(v) === i).sort(); // unique sort
  let hashid = hash(JSON.stringify(inline_classes));
  let className = `.tw-${hashid}`;
  if (!(hashid in TAILWIND_CLASSES)) TAILWIND_CLASSES[className] = new ClassList(className, inline_classes).build();
  return className;
}


export default function preprocessTailwind({content}) {
  const parsed = parse(content);
  const code = new MagicString(content);

  walk(parsed.html, {
    leave(node) {
      if (node.type === 'Attribute' && node.name === 'class') {
        node.value.forEach(({start, end, data}) => {
          code.overwrite(start, end, cleanClasses(data));
        })
      }
    }
  })
  let tailwindcss = `
h1 {
  text-align: left;
}
`;
  if (parsed.css === undefined) {
    code.trimEnd().append(`\n\n<style>${tailwindcss}</style>`)
  }
  walk(parsed.css, {
    leave(node) {
      if (node.type === 'Style') {
        code.prependLeft(node.content.start, tailwindcss);
      }
    }
  })

  console.log(TAILWIND_CLASSES)
  // const h1 = new Selector('h1');
  // h1.add('text-align', 'left');
  // h1.add('background', '#222');
  
  // const h2 = new Selector('h2');
  // h2.add('font-size', '1rem');
  // h2.add('padding', 0);

  // const rule = new Rule([h1, h2]);
  // const atrule = new AtRule('@media (min-width: 768px)', [rule]);
  // console.log(atrule.build());
  // console.log(code.toString())
 
  return {code: code.toString()}
}
