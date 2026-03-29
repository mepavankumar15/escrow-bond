import { createHash } from "crypto";

const getDiscriminator = (name) => {
  const hash = createHash("sha256").update(`global:${name}`).digest();
  return Array.from(hash.slice(0, 8));
};

const instructions = ["initializeEscrow", "depositByTaker", "executeEscrow", "cancelEscrow"];

const discriminators = {};
for (const name of instructions) {
  discriminators[name] = getDiscriminator(name);
}

console.log(JSON.stringify(discriminators, null, 2));
