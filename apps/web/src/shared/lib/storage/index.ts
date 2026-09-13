export class StorageError extends Error {
    constructor() { super('STORAGE_UNAVAILABLE_OR_INVALID'); this.name = 'StorageError'; }
}
export function readJson(key: string): unknown {
    try {
        const value = window.localStorage.getItem(key);
        return value === null ? null : JSON.parse(value);
    }
    catch {
        throw new StorageError();
    }
}
export function writeJson(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
    catch {
        throw new StorageError();
    }
}
export function downloadJson(name: string, value: unknown): void {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 70) || 'flavorpilot-recipe'}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
