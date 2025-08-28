const { schnorr } = require("@noble/secp256k1");
const { hexToBytes, bytesToHex } = require("@noble/hashes/utils");
const { hashes } = require("@noble/secp256k1/index");
const { sha256 } = require("@noble/hashes/sha2");

hashes.sha256 = sha256;

// Your test keys (generate these once and reuse for testing)
const PRIVATE_KEY_HEX =
	"51e38f26e37b92a70484162225bca6c18869caebd28b910a3afd74521dc17154";

async function signHash(hashToSignHex) {
	try {
		const signature = await schnorr.sign(
			hexToBytes(hashToSignHex),
			hexToBytes(PRIVATE_KEY_HEX),
		);
		return bytesToHex(signature);
	} catch (error) {
		console.error("Signing failed:", error);
		throw error;
	}
}

// If hash provided as command line argument
if (process.argv[2]) {
	signHash(process.argv[2])
		.then((signature) => {
			console.log("Signature:", signature);
		})
		.catch(console.error);
} else {
	console.log("Usage: node sign-challenge.js <hashToSignHex>");
	console.log("Public key for testing:", PUBLIC_KEY_HEX);
}
