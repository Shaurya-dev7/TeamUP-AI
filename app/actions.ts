'use server';

export async function logError(message: string, error: any) {
    console.error(`[CLIENT ERROR] ${message}`);
    console.error(JSON.stringify(error, null, 2));
}
