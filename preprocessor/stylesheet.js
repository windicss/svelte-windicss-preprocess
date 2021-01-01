import { wrapit } from './utils'

const TAB = '  ';
const SEPARATOR = '\n\n';


export class Property {
    constructor(key, value, pseudo=null, atrule=null) {
        this.key = key;
        this.value = value;
        this.pseudo = pseudo;
        this.atrule = atrule;
    }

    build() {
        return `${this.key}: ${this.value};`;
    }
}


export class Selector {
    constructor(name=null, properties=[]) {
        this.name = name;
        this.properties = properties;
    }

    add(key, value) {
        this.properties.push(new Property(key, value));
    }
    
    build() {
        const properties = this.properties.map(property=>property.build()).join('\n');
        return this.name?`${this.name} ${wrapit(properties, tab=TAB)}` : properties;
    }
}


export class Rule {
    constructor(selectors=[]) {
        this.selectors = selectors;
    }

    add(selector) {
        this.selectors.push(selector);
    }

    build() {
        return this.selectors.map(selector=>selector.build()).join(SEPARATOR);
    }
}


export class AtRule {
    constructor(name, children=[]) {
        this.name = name;
        this.children = children;
    }

    add(rule) {
        this.children.push(rule);
    }

    build() {
        return `${this.name} ${wrapit(this.children.map(rule=>rule.build()).join(SEPARATOR), tab=TAB)}`;
    }
}


export class StyleSheet {
    constructor(children=[], wrap=true) {
        this.children = children;
        this.wrap = wrap;
    }

    add(rule) {
        this.children.push(rule);
    }

    build() {
        let style = this.children.map(rule=>rule.build()).join(SEPARATOR);
        if (wrap) style = wrapit(style, start='<style>', end='</style>', tab=TAB);
        return style;
    }
}