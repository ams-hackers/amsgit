import { unzlib } from "https://deno.land/x/denoflate/mod.ts";

async function readObject(hash: string) {
  const prefix = hash.slice(0, 2);
  const suffix = hash.slice(2);
  const path = `.git/objects/${prefix}/${suffix}`;
  return unzlib(await Deno.readFile(path));
}

const data = await readObject("9daeafb9864cf43055ae93beb0afd6c7d144bfa4");

const headerSize = data.indexOf(0);

const decoder = new TextDecoder("utf-8");
const header = decoder.decode(data.slice(0, headerSize));

const body = data.slice(headerSize + 1);

console.log({
  header,
  body: decoder.decode(body),
});
