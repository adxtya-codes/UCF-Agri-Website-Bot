import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

export async function readJSON<T>(filename: string): Promise<T[]> {
    try {
        const filePath = path.join(DATA_DIR, filename);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
}

export async function writeJSON<T>(filename: string, data: T[]): Promise<void> {
    try {
        const filePath = path.join(DATA_DIR, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        throw error;
    }
}

export function getDataPath(filename: string): string {
    return path.join(DATA_DIR, filename);
}
