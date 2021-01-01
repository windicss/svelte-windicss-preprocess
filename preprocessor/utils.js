import MagicString from 'magic-string'

export function wrapit(string, start = '{', end = '}', tab='  ') {
    const magic = new MagicString(string);
    magic.indent(tab).prepend(`${start}\n`).append(`\n${end}`);
    return magic.toString();
}

export function hash(str) {
    str = str.replace(/\r/g, '');
    let hash = 5381;
    let i = str.length;
  
    while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return (hash >>> 0).toString(36);
}

export function hex2RGB(str) {
    const RGB_HEX = /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;
    const [ , short, long ] = String(str).match(RGB_HEX) || [];

    if (long) {
        const value = Number.parseInt(long, 16);
        return [ value >> 16, value >> 8 & 0xFF, value & 0xFF ];
    } else if (short) {
        return Array.from(short, s => Number.parseInt(s, 16)).map(n => (n << 4) | n);
    }
};