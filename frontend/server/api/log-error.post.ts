export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.error('\n================ BROWSER ERROR CATCHED ================');
  console.error(`URL:   ${body.url}`);
  console.error(`ERROR: ${body.message}`);
  if (body.stack) {
    console.error(`STACK:\n${body.stack}`);
  }
  console.error('========================================================\n');
  return { success: true };
});
