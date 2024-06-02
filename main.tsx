import {
    changePasswordRoute,
    loginRoute,
    signUpRoute,
} from "./src/authorization";
import { updateCollectionRoute, getCollectionRoute } from "./src/collections";
import { getUserDetailsRoute, updateUserDetailsRoute } from "./src/users";

const server = Bun.serve({
    port: 9253,
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
        if (request.method === "POST" && pathname === "/get/user") {
            return getUserDetailsRoute(request);
        }
        if (request.method === "POST" && pathname === "/set/user") {
            return updateUserDetailsRoute(request);
        }
        if (request.method === "POST" && pathname === "/get/collection") {
            return getCollectionRoute(request);
        }
        if (request.method === "POST" && pathname === "/set/collection") {
            return updateCollectionRoute(request);
        }

        return new Response("Powercards API v1");
    },
});

console.log(`Listening on localhost:${server.port}`);
