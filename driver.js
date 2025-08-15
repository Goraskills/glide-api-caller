window.addEventListener("message", async function(event) {
  const { data: { key, params } } = event;

  let result;
  try {
    result = await window.function(...params);
  } catch (e) {
    result = undefined;
  }

  const response = { key };
  if (result !== undefined) {
    response.result = { type: "string", value: result };
  }

  event.source.postMessage(response, "*");
});
