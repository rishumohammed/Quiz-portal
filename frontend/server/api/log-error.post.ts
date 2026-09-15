export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {};
    if (body.message) {
      console.error('\n================ BROWSER ERROR CATCHED ================');
      console.error(`URL:   ${body.url || 'N/A'}`);
      console.error(`ERROR: ${body.message}`);
      if (body.stack) {
        console.error(`STACK:\n${body.stack}`);
      }
      console.error('========================================================\n');
    }
  } catch (e) {
    // Ignore invalid JSON payload gracefully
  }
  return { success: true };
});

