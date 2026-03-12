export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startParseServer } = await import('@/server/parse-server');
    await startParseServer();
  }
}
