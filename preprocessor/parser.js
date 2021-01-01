import { Utility } from './utilities/index'
import { wrapit } from './utils'

export class ClassName {
    constructor(raw) {
        this.raw = raw;
        const pieces = raw.split(':');
        this.utility = new Utility(pieces.pop());
        this.variants = pieces;
    }

    build() {
        if (this.variants.length>0) {
            return '';
        };
        return this.utility.build();
    }
}

export class ClassList {
    constructor(name=null, children=[]) {
        this.name = name;
        this.children = children;
    }

    build() {
        const properties = this.children.map(i=>new ClassName(i).build()).join('\n');
        return this.name?`${this.name} ${wrapit(properties)}` : properties;
    }
}