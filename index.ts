import { unzlib } from "https://deno.land/x/denoflate/mod.ts";
const decoder = new TextDecoder("utf-8");

async function readRawObject(hash: string) {
  const prefix = hash.slice(0, 2);
  const suffix = hash.slice(2);
  const path = `.git/objects/${prefix}/${suffix}`;
  const data = unzlib(await Deno.readFile(path));
  const headerSize = data.indexOf(0);
  const header = decoder.decode(data.slice(0, headerSize));
  const [type, size] = header.split(" ");
  const body = data.slice(headerSize + 1);
  return { type, size, body };
}

function toHexString(data: Uint8Array) {
  return [...data].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function decodeTree(data: Uint8Array) {
  const entries: Array<{ mode: string; filename: string; hash: string }> = [];
  let offset = 0;
  while (true) {
    const newOffset = data.indexOf(0, offset);
    if (newOffset === -1) break;
    const file = decoder.decode(data.slice(offset, newOffset));
    const [mode, filename] = file.split(" ", 2);
    const hash = toHexString(data.slice(newOffset + 1, newOffset + 1 + 20));
    entries.push({ mode, filename, hash });
    offset = newOffset + 1 + 20;
  }
  return entries;
}

async function readTree(hash: string) {
  const { type, body } = await readRawObject(hash);
  if (type !== "tree") {
    throw new Error(`Expected tree but got ${type}`);
  }
  return decodeTree(body);
}

async function readBlob(hash: string) {
  const { type, body } = await readRawObject(hash);
  if (type !== "blob") {
    throw new Error(`Expected blob but got ${type}`);
  }
  return body;
}

async function readObject(hash: string) {
  const { type, body } = await readRawObject(hash);
  switch (type) {
    case "tree":
      return decodeTree(body);
    case "blob":
      return body;
    default:
      throw new Error(`Unable to decode type ${type}`);
  }
}

const tree = await readObject(Deno.args[0]);
console.log(tree);
