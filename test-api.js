async function testApi() {
  const url = new URL("https://script.google.com/macros/s/AKfycby-8in_XL-e8HqefmYLOl9sie3Vd4SAdVBT_t15r99n4ROkjawp_axAcL0FoguklfEc8g/exec");
  url.searchParams.set("action", "login");

  const options = {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "login", email: "petugas@maswh.id", password: "petugas123" })
  };

  try {
    console.log("Sending POST to:", url.toString());
    const res = await fetch(url.toString(), options);
    console.log("Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Response:", text);

  } catch (e) {
    console.error("Fetch failed:", e);
  }
}


testApi();
