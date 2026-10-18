import { readFileSync } from 'node:fs';

/** USDA quoted CSV, including commas/newlines and doubled quotes inside fields. */
export function readCsv(file) {
    const text = readFileSync(file, 'utf8'), rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (char === '"') quoted = false;
            else field += char;
        } else if (char === '"') quoted = true;
        else if (char === ',') { row.push(field); field = ''; }
        else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (char !== '\r') field += char;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    const [header, ...body] = rows.filter(value => value.length > 1);
    return body.map(value => Object.fromEntries(header.map((key, i) => [key, value[i] ?? ''])));
}
