import { searchGroup, searchNotEscape } from "./utils";
import type { Tag, Text, Expression } from "./interfaces";

export default class Parser {
  content: string;
  index = 0;
  constructor(content: string) {
    this.content = content;
  }

  _parseTag(): Tag["value"] {
    const nodes: Tag["value"] = [];

    while (!this.end) {
      const attr = this.food.match(/\S+\s*=\s*/);
      const endTag = searchNotEscape(this.food, ">");

      if (!attr || attr.index === undefined) break;
      if (endTag === -1 || endTag < attr.index) break;

      const start = this.index + attr.index;
      this.eatTo(attr.index + attr[0].length);

      let name = attr[0].replace(/\s*=\s*$/, "");
      let type = /^class:\S+/.test(name)
        ? "Directive"
        : ("Attribute" as "Directive" | "Attribute");
      if (type === "Directive") name = name.replace(/^class:/, "");

      const startChar = this.first;
      switch (startChar) {
        case `"`:
        case `'`:
          this.eat(startChar);
          this.eatSpace();
          const children: (Text | Expression)[] = [];

          while (!this.end) {
            const nextBracket = searchNotEscape(this.food, "{");
            const nextQuote = searchNotEscape(this.food, startChar);

            if (nextQuote < nextBracket || nextBracket === -1) {
              let value = this.spitSpace(this.eatTo(nextQuote));
              if (value.data) children.push({ ...value, type: "Text" });
              break;
            }

            // text before group
            const value = this.spitSpace(this.eatTo(nextBracket));
            if (value.data) children.push({ ...value, type: "Text" });

            // handle group
            this.eat("{");
            const groupEnd = searchGroup(this.food);
            const group = this.eatTo(groupEnd);
            this.eat("}");
            this.eatSpace();
            children.push({ ...group, type: "Expression" });
          }

          const endChar = this.eat(startChar); // eat end quote
          nodes.push({ start, end: endChar.end, type, name, value: children });
          break;

        case "{":
          this.eat(startChar);
          const groupEnd = searchGroup(this.food);
          const value = this.eatTo(groupEnd);
          this.eat(startChar); // eat end bracket
          nodes.push({
            start,
            end: value.end + 1,
            type,
            name,
            value: { ...value, type: "Expression" },
          });
          break;

        default:
          const one = this.food.match(/^[^\s>]+/)?.[0];
          if (one) {
            const value = this.eat(one);
            nodes.push({
              start,
              end: value.end,
              type,
              name,
              value: { ...value, type: "Text" },
            });
          }
          break;
      }
    }
    return nodes;
  }

  parse(): Tag[] {
    const output: Tag[] = [];
    while (!this.end) {
      const tag = this.food.match(/<[^\s/]+/);
      if (!tag || tag.index === undefined) break;
      const decl = this.eat(tag[0]);
      const value = this._parseTag();
      this.eat(">");
      output.push({
        start: decl.start,
        end: this.index,
        name: tag[0].slice(1),
        value,
      });
    }
    return output;
  }

  slice(start?: number, end?: number): string {
    return this.content.slice(start, end);
  }

  eat(str: string) {
    const start = this.index;
    this.index += str.length;
    return {
      start,
      end: this.index,
      data: str,
    };
  }

  eatSpace() {
    const spaces = this.food.match(/^\s+/);
    if (spaces) this.index += spaces[0].length;
  }

  spitSpace({
    start,
    end,
    data,
  }: {
    start: number;
    end: number;
    data: string;
  }) {
    const spaces = data.match(/\s+$/);
    if (spaces) {
      data = data.slice(0, spaces.index);
      end -= spaces[0].length;
    }
    return { start, end, data };
  }

  eatTo(end: number) {
    const start = this.index;
    const food = this.food.slice(0, end);
    this.index += end;
    return {
      start,
      end: this.index,
      data: food,
    };
  }

  get food() {
    return this.content.slice(this.index);
  }

  get first() {
    return this.content.charAt(this.index);
  }

  get end() {
    return this.index === this.content.length;
  }
}
