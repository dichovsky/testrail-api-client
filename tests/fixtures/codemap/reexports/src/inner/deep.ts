export type Beta = { value: number };
export function alpha(): Beta {
    return { value: 1 };
}
export function renamed(): string {
    return 'renamed';
}
export function privateOnly(): void {}
