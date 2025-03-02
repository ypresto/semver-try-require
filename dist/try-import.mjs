import path from "path/posix";
import { createRequire } from "module";
import { coerce, satisfies } from "semver";
const LOCAL_MODULE_RE = /^[.]{1,2}($|\/.*)/g;
const ABSOLUTE_MODULE_RE = /^\/.*/g;
const PACKAGE_RE = "[^/]+";
const SCOPED_PACKAGE_RE = "@[^/]+(/[^/]+)";
const ROOT_MODULE_RE = new RegExp(`^(${SCOPED_PACKAGE_RE}|${PACKAGE_RE})`, "g");
const require = createRequire(import.meta.url);
function extractRootModuleName(pModuleName) {
    if (pModuleName.match(LOCAL_MODULE_RE) ||
        pModuleName.match(ABSOLUTE_MODULE_RE)) {
        return pModuleName;
    }
    else {
        return (pModuleName.match(ROOT_MODULE_RE) || []).shift();
    }
}
function getVersion(pModuleName) {
    const lManifest = require(path.join(extractRootModuleName(pModuleName), "package.json"));
    return lManifest.version;
}
export default async function tryImport(pModuleName, pSemanticVersion) {
    let lReturnValue = false;
    try {
        const lModule = await import(pModuleName);
        lReturnValue = lModule.default ? lModule.default : lModule;
        if (pSemanticVersion) {
            const lVersion = getVersion(pModuleName);
            const lCoerced = coerce(lVersion);
            if (lVersion &&
                lCoerced &&
                !satisfies(lCoerced.version, pSemanticVersion)) {
                lReturnValue = false;
            }
        }
    }
    catch (pError) {
        lReturnValue = false;
    }
    return lReturnValue;
}
