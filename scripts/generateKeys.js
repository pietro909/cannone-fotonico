const { schnorr, utils, getPublicKey, hashes } = require("@noble/secp256k1");
const { bytesToHex } = require("@noble/hashes/utils");
const { sha256 } = require("@noble/hashes/sha2");

// Set up hashing like in E2E test
hashes.sha256 = sha256;

function generateTestKeys() {
	// Generate private key using the same method as E2E test
	const privateKey = utils.randomSecretKey();
	const privateKeyHex = bytesToHex(privateKey);

	// Generate public key using the same method as E2E test (compressed)
	const publicKeyBytes = getPublicKey(privateKey, true);
	const publicKeyHex = Buffer.from(publicKeyBytes).toString("hex");

	console.log("Test Keys Generated (matching E2E test method):");
	console.log("Private Key:", privateKeyHex);
	console.log("Public Key (compressed):", publicKeyHex);
	console.log("\nSave these keys for testing!");
}

generateTestKeys();
