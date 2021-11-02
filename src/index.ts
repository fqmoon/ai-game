import * as BABYLON from 'babylonjs'

BABYLON.DracoCompression.Configuration = {
    decoder: {
        wasmUrl: "draco_wasm_wrapper_gltf.js",
        wasmBinaryUrl: "draco_decoder_gltf.wasm",
        fallbackUrl: "draco_decoder_gltf.js",
    }
};

import {createGame} from "./game";

async function main() {
    let game = await createGame()
}

main()