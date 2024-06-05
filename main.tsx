import {
    changePasswordRoute,
    loginRoute,
    signUpRoute,
} from "./src/authorization";
import {
    updateCollectionRoute,
    getCollectionRoute,
    getManyCollectionsRoute,
} from "./src/collections";
import {
    getLearningSetRoute,
    getManyLearningSetsRoute,
    updateLearningSetRoute,
} from "./src/learningsets";
import { getUserDetailsRoute, updateUserDetailsRoute } from "./src/users";

const server = Bun.serve({
    port: import.meta.env.PORT || 8080,
    hostname: import.meta.env.HOSTNAME,
    fetch(request) {
        const pathname = new URL(request.url).pathname;
        console.log(`${request.method} ${pathname}`);
        if (request.method === "POST" && pathname === "/auth/signup") {
            return signUpRoute(request);
        }
        if (request.method === "POST" && pathname === "/auth/login") {
            return loginRoute(request);
        }
        if (request.method === "POST" && pathname === "/auth/change-password") {
            return changePasswordRoute(request);
        }
        if (request.method === "POST" && pathname === "/user/get") {
            return getUserDetailsRoute(request);
        }
        if (request.method === "POST" && pathname === "/user/set") {
            return updateUserDetailsRoute(request);
        }
        if (request.method === "POST" && pathname === "/collection/get") {
            return getCollectionRoute(request);
        }
        if (request.method === "POST" && pathname === "/collection/get-many") {
            return getManyCollectionsRoute(request);
        }
        if (request.method === "POST" && pathname === "/collection/set") {
            return updateCollectionRoute(request);
        }
        if (request.method === "POST" && pathname === "/sets/get") {
            return getLearningSetRoute(request);
        }
        if (request.method === "POST" && pathname === "/sets/get-many") {
            return getManyLearningSetsRoute(request);
        }
        if (request.method === "POST" && pathname === "/sets/set") {
            return updateLearningSetRoute(request);
        }

        return new Response("Powercards API v1");
    },
});

console.log(`Listening on ${server.hostname}:${server.port}`);
