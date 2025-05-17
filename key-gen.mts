import { randomBytes } from "crypto";

const generateBytes = async (byteSize: number) => {
    const key = randomBytes(byteSize);
    return key.toString('base64');
};

/**
 * npx ts-node ./key-gen.mts
 */
generateBytes(32).then((key) => console.log({ key }));
generateBytes(16).then((iv) => console.log({ iv }));